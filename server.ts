import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Compression
app.use(compression());

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true, // Explicit XSS Protection
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
        preload: true,
      },
      dnsPrefetchControl: { allow: false },
      frameguard: false, // Prevents Clickjacking but allows nested sandbox preview rendering
      hidePoweredBy: true,
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    })
  );

  // Serve security.txt
  app.get("/.well-known/security.txt", (req, res) => {
    res.type("text/plain");
    res.send(
      `Contact: mailto:security@noto.example.com\nExpires: 2027-01-01T00:00:00.000Z\nPreferred-Languages: en, id\n`
    );
  });

  // Self-uninstalling Service Worker to clear any stuck PWA cache in user browsers
  const uninstallSW = (req: express.Request, res: express.Response) => {
    res.type("application/javascript");
    res.send(`
      self.addEventListener('install', (e) => {
        self.skipWaiting();
      });
      self.addEventListener('activate', (e) => {
        self.registration.unregister()
          .then(() => self.clients.matchAll())
          .then((clients) => {
            clients.forEach(client => {
              if (client.navigate) {
                client.navigate(client.url);
              }
            });
          });
      });
    `);
  };

  app.get("/sw.js", uninstallSW);
  app.get("/dev-sw.js", uninstallSW);

  // Helper to lazy-initialize GoogleGenAI
  function getGeminiClient(customKey?: string) {
    const key = customKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    const cleanKey = String(key).trim();
    return new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Helper to call generateContent with model fallbacks to handle 503 high demand gracefully
  async function generateContentWithFallback(ai: any, options: {
    contents: any;
    config?: any;
    models?: string[];
  }) {
    const modelsToTry = options.models || [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    ];
    let lastError: any = null;
    let quotaError: any = null;

    for (const model of modelsToTry) {
      try {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        console.log(`[Google Gemini API Request]:`, {
          url: targetUrl,
          model: model,
          contentsLength: options.contents?.length,
          hasConfig: !!options.config,
        });

        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        console.log(`[Google Gemini API Response Success]:`, {
          model,
          status: 200,
          responseLength: response.text ? response.text.length : 0,
        });

        return response;
      } catch (err: any) {
        const errMsg = err.message || String(err);
        const errStatus = err.status || err.statusCode || "UNKNOWN";
        
        console.error(`[Google Gemini API Response Error]: Model ${model} failed with status ${errStatus}: ${errMsg.substring(0, 150)}...`);
        
        lastError = err;
        lastError.model = model;
        
        // If it's explicitly an API key authentication error, throw immediately so we don't spam the API
        if (
          errStatus === 401 ||
          errMsg.includes("API_KEY_INVALID") ||
          errMsg.includes("API key not valid") ||
          errMsg.includes("GEMINI_API_KEY_MISSING")
        ) {
          throw err;
        }

        // If it's a quota error, save it so we can throw it instead of a 404 if all models fail
        if (errStatus === 429 || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
           quotaError = err;
        }
      }
    }
    
    if (quotaError) throw quotaError;
    if (lastError) {
      lastError.message = `[${lastError.model}] ${lastError.message}`;
      throw lastError;
    }
    throw new Error("All models failed");
  }

  function detectProvider(apiKey: string): 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter' {
    const key = apiKey.trim();
    if (key.startsWith("AIzaSy") || key.startsWith("AQ") || key.startsWith("AI")) {
      return 'gemini';
    }
    if (key.startsWith("sk-ant-")) {
      return 'anthropic';
    }
    if (key.startsWith("sk-or-")) {
      return 'openrouter';
    }
    if (key.startsWith("gsk_")) {
      return 'groq';
    }
    if (key.startsWith("sk-")) {
      return 'openai';
    }
    return 'gemini'; // Default to gemini
  }

  async function testApiKeyWithProvider(apiKey: string, provider: string, lang: string): Promise<void> {
    const cleanKey = apiKey.trim();
    if (provider === 'gemini') {
      const ai = getGeminiClient(cleanKey);
      await generateContentWithFallback(ai, {
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        config: { maxOutputTokens: 5 }
      });
    } else if (provider === 'openai') {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `OpenAI API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'anthropic') {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 5,
          messages: [{ role: "user", content: "Hello" }]
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `Anthropic API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'groq') {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `Groq API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    } else if (provider === 'openrouter') {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `OpenRouter API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
    }
  }

  async function handleChatWithProvider(
    apiKey: string,
    provider: string,
    messages: any[],
    systemInstruction: string,
    lang: string
  ): Promise<string> {
    const cleanKey = apiKey.trim();
    if (provider === 'gemini') {
      const ai = getGeminiClient(cleanKey);
      const formattedContents = (messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || "" }]
      }));
      const response = await generateContentWithFallback(ai, {
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });
      return response.text || "";
    } else if (provider === 'openai') {
      const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...(messages || []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content || ""
        }))
      ];
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          temperature: 0.8
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `OpenAI API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    } else if (provider === 'anthropic') {
      const formattedMessages = (messages || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || ""
      }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 4096,
          system: systemInstruction,
          messages: formattedMessages,
          temperature: 0.8
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `Anthropic API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      const data = await res.json();
      return data?.content?.[0]?.text || "";
    } else if (provider === 'groq') {
      const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...(messages || []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content || ""
        }))
      ];
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: formattedMessages,
          temperature: 0.8
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `Groq API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    } else if (provider === 'openrouter') {
      const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...(messages || []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content || ""
        }))
      ];
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json", "HTTP-Referer": "https://noto.app", "X-Title": "Noto AI"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: formattedMessages,
          temperature: 0.8
        })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = `OpenRouter API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        const err: any = new Error(errMsg); err.status = res.status; throw err;
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    }
    return "";
  }

  function parseGeminiError(error: any, lang: string): string {
    let msg = error.message || String(error);
    
    // If the error contains a JSON object (typical for @google/genai SDK)
    if (typeof msg === 'string') {
      const firstBrace = msg.indexOf("{");
      const lastBrace = msg.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const jsonStr = msg.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(jsonStr);
          if (parsed?.error?.message) {
            msg = parsed.error.message;
          } else if (parsed?.message) {
            msg = parsed.message;
          }
        } catch (_) {}
      }
    }

    const raw = error.status || error.statusCode || 500; const errStatus = (typeof raw === "number" && !isNaN(raw)) ? raw : 500;
    const isNotFoundError = 
      errStatus === 404; 

    if (isNotFoundError) {
      return lang === 'id'
        ? `Model atau Endpoint API tidak ditemukan (Error 404): ${msg}. Harap pastikan API Key mendukung model ini.`
        : `API Model or Endpoint not found (Error 404): ${msg}. Please ensure your API Key supports this model.`;
    }
    
    // Translate common errors into helpful Indonesian / English messages
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID") || msg.includes("API key") || msg.includes("GEMINI_API_KEY_MISSING") || errStatus === 401) {
      return lang === 'id' 
        ? `Error 401: API Key tidak valid atau ditolak oleh penyedia layanan. Detail: ${msg}`
        : `Error 401: Invalid API Key or rejected by provider. Detail: ${msg}`;
    }
    
    if (msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit") || msg.includes("quota") || errStatus === 429) {
      return lang === 'id'
        ? `Error 429: Batas kuota API Key terlampaui atau Anda terkena rate limit. Detail: ${msg}`
        : `Error 429: API Key quota exceeded or rate limited. Detail: ${msg}`;
    }
    
    if (msg.includes("experiencing high demand") || msg.includes("UNAVAILABLE") || errStatus === 503) {
      return lang === 'id'
        ? `Error 503: Layanan AI sedang sibuk. Detail: ${msg}`
        : `Error 503: The AI service is currently experiencing high demand. Detail: ${msg}`;
    }

    if (msg.includes("User location is not supported")) {
      return lang === 'id'
        ? `Lokasi Anda saat ini tidak didukung oleh layanan API Google Gemini.`
        : `Your current location is not supported by Google Gemini API.`;
    }
    
    return lang === 'id' ? `Gagal terhubung (Error ${errStatus}): ${msg}` : `Connection failed (Error ${errStatus}): ${msg}`;
  }

  // Noto AI Key Testing Endpoint
  app.post("/api/ai/test-key", async (req, res) => {
    const lang = req.body.lang || 'id';
    console.log(`[API /api/ai/test-key Request] Received test request.`);
    try {
      const { apiKey } = req.body;
      const testKey = apiKey || process.env.GEMINI_API_KEY;
      if (!testKey) {
        console.error(`[API /api/ai/test-key Error] Missing API Key.`);
        return res.status(400).json({ error: "missing_api_key" });
      }

      const provider = detectProvider(testKey);
      console.log(`[API /api/ai/test-key] Detected provider: ${provider}`);

      await testApiKeyWithProvider(testKey, provider, lang);
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error(`[API /api/ai/test-key Exception]: ${error.message || String(error).substring(0, 100)}`);
      const parsedMsg = parseGeminiError(error, lang);
      const raw = error.status || error.statusCode || 400; const errStatus = (typeof raw === "number" && !isNaN(raw)) ? raw : 400;
      res.status(errStatus).json({ error: parsedMsg });
    }
  });

  // Noto AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    const { messages, lang, customApiKey } = req.body;
    console.log(`[API /api/ai/chat Request] Messages Count: ${messages?.length || 0}`);
    try {
      const activeKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({ error: "missing_api_key" });
      }

      const provider = detectProvider(activeKey);
      console.log(`[API /api/ai/chat] Detected provider: ${provider}`);
      
      const systemInstruction = lang === 'id' 
        ? "Anda adalah Noto AI, asisten pribadi dan sahabat kehidupan yang berempati, bijaksana, dan ramah. Anda mematuhi prinsip privasi Noto secara mutlak: Anda tidak pernah memiliki akses langsung ke database pengguna, catatan, atau keuangan mereka. Anda hanya menerima dan memproses data minimal yang secara sadar diizinkan dan dikirimkan oleh pengguna sebagai teks ringkasan di dalam pesan chat ini. Jangan pernah mengklaim memiliki akses otomatis atau langsung ke data lokal mereka. Jawablah dengan hangat, tawarkan saran praktis, berikan dukungan moral, dan motivasi yang tulus. Selalu gunakan Bahasa Indonesia yang natural, santun, dan menyemangati."
        : "You are Noto AI, an empathetic, wise, and friendly personal life coach and companion. You strictly adhere to Noto's privacy-first principle: you have absolutely no direct access to the user's local database, notes, or financial records. You only see and process the minimal, aggregated summary text that the user has explicitly consented to share and send within this chat conversation. Never claim to have direct or automatic access to their private local database. Answer warmly, provide actionable and helpful advice, show empathy, and keep your tone deeply inspiring. Always communicate in a natural and friendly English tone.";

      const reply = await handleChatWithProvider(activeKey, provider, messages, systemInstruction, lang);
      res.json({ reply });
    } catch (error: any) {
      console.error(`[API /api/ai/chat Exception]: ${error.message || String(error).substring(0, 100)}`);
      const parsedMsg = parseGeminiError(error, lang || 'id');
      const raw = error.status || error.statusCode || 500; const errStatus = (typeof raw === "number" && !isNaN(raw)) ? raw : 500;
      res.status(errStatus).json({ error: parsedMsg });
    }
  });

  // Export app for serverless platforms like Vercel
  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Express Global Error]:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  export default app;

  async function startServer() {
    // Vite middleware for development (check process.env.NODE_ENV or process.env.VITE_DEV)
    const isDev = process.env.NODE_ENV !== "production" || process.env.VITE_DEV === "true";

    if (isDev) {
      const viteModule = await import("vite");
      const vite = await viteModule.createServer({
        server: { 
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
        },
        
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Production static serving
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath, {
        setHeaders: (res, path, stat) => {
          // Cache control for static assets
          if (path.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-store, max-age=0");
          } else {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        }
      }));

      app.get("*all", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running securely on port ${PORT}`);
    });
  }

  // Only start the server if it's run directly (not imported as a module in Vercel)
  if (process.env.NODE_ENV !== "production" || process.argv[1]?.endsWith('server.cjs') || process.env.START_SERVER === 'true') {
    startServer();
  }
