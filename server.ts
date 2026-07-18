import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
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
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-2.5-flash",
      "gemini-flash-latest"
    ];
    let lastError: any = null;

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
        console.error(`[Google Gemini API Response Error]: Model ${model} failed:`, {
          status: err.status || err.statusCode || "UNKNOWN",
          message: err.message || String(err),
          rawError: err,
        });
        
        lastError = err;
        
        // If it's a configuration or authentication error, do not retry other models
        if (err.message && (err.message.includes("API key") || err.message.includes("GEMINI_API_KEY_MISSING") || err.status === 403 || err.status === 401)) {
          throw err;
        }
      }
    }
    
    throw lastError || new Error("All models failed");
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
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
      }
    } else if (provider === 'anthropic') {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
      }
    } else if (provider === 'groq') {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
      }
    } else if (provider === 'openrouter') {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
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
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
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
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
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
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
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
          "Content-Type": "application/json"
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
        throw new Error(errMsg);
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "";
    }
    return "";
  }

  function parseGeminiError(error: any, lang: string): string {
    let msg = error.message || String(error);
    
    // If the error is a JSON string (typical for @google/genai SDK)
    if (typeof msg === 'string' && msg.startsWith("{") && msg.endsWith("}")) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch (_) {}
    }

    const errStatus = error.status || error.statusCode;
    const isNotFoundError = 
      errStatus === 404 || 
      msg.includes("404") || 
      msg.toLowerCase().includes("not found") || 
      msg.toLowerCase().includes("not_found");

    if (isNotFoundError) {
      return lang === 'id'
        ? `Model atau Endpoint API tidak ditemukan (Error 404): ${msg}. Harap gunakan model atau endpoint yang didukung.`
        : `API Model or Endpoint not found (Error 404): ${msg}. Please use a supported model or endpoint.`;
    }
    
    // Translate common errors into helpful Indonesian / English messages
    if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return lang === 'id' 
        ? "API Key tidak valid. Harap periksa kembali kunci yang Anda masukkan."
        : "Invalid API Key. Please double check the key you copied.";
    }
    
    if (msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit") || msg.includes("quota")) {
      return lang === 'id'
        ? "Batas kuota API Key terlampaui. Harap coba lagi beberapa saat lagi atau gunakan kunci lain."
        : "API Key quota exceeded. Please try again in a few moments or use a different key.";
    }
    
    if (msg.includes("experiencing high demand") || msg.includes("UNAVAILABLE") || msg.includes("503")) {
      return lang === 'id'
        ? "Layanan AI sedang sibuk (Error 503). Harap coba sesaat lagi."
        : "The AI service is currently experiencing high demand (Error 503). Please try again shortly.";
    }

    if (msg.includes("User location is not supported")) {
      return lang === 'id'
        ? "Lokasi Anda saat ini tidak didukung oleh layanan API Google Gemini."
        : "Your current location is not supported by Google Gemini API.";
    }
    
    return msg;
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
      console.error("[API /api/ai/test-key Exception]:", error);
      const parsedMsg = parseGeminiError(error, lang);
      const errStatus = error.status || error.statusCode || 400;
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
      console.error("[API /api/ai/chat Exception]:", error);
      const parsedMsg = parseGeminiError(error, lang || 'id');
      const errStatus = error.status || error.statusCode || 500;
      res.status(errStatus).json({ error: parsedMsg });
    }
  });

  // Vite middleware for development (check process.env.NODE_ENV or process.env.VITE_DEV)
  const isDev = process.env.NODE_ENV !== "production" || process.env.VITE_DEV === "true";

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

startServer();
