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
    return new GoogleGenAI({
      apiKey: key,
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
    const modelsToTry = options.models || ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Attempting generateContent with model: ${model}`);
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        console.warn(`Model ${model} failed:`, err.message || err);
        lastError = err;
        
        // If it's a configuration or authentication error, do not retry other models
        if (err.message && (err.message.includes("API key") || err.message.includes("GEMINI_API_KEY_MISSING") || err.status === 403 || err.status === 401)) {
          throw err;
        }
      }
    }
    
    throw lastError || new Error("All models failed");
  }

  // Noto AI Key Testing Endpoint
  app.post("/api/ai/test-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      const testKey = apiKey || process.env.GEMINI_API_KEY;
      if (!testKey) {
        return res.status(400).json({ error: "missing_api_key" });
      }
      const ai = getGeminiClient(testKey);
      await generateContentWithFallback(ai, {
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        config: { maxOutputTokens: 5 }
      });
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Test Key Error:", error.message || error);
      res.status(400).json({ error: error.message || "Failed to validate key" });
    }
  });

  // Noto AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, lang, customApiKey } = req.body;
      const ai = getGeminiClient(customApiKey);
      
      const systemInstruction = lang === 'id' 
        ? "Anda adalah Noto AI, asisten pribadi dan sahabat kehidupan yang berempati, bijaksana, dan ramah. Anda mematuhi prinsip privasi Noto secara mutlak: Anda tidak pernah memiliki akses langsung ke database pengguna, catatan, atau keuangan mereka. Anda hanya menerima dan memproses data minimal yang secara sadar diizinkan dan dikirimkan oleh pengguna sebagai teks ringkasan di dalam pesan chat ini. Jangan pernah mengklaim memiliki akses otomatis atau langsung ke data lokal mereka. Jawablah dengan hangat, tawarkan saran praktis, berikan dukungan moral, dan motivasi yang tulus. Selalu gunakan Bahasa Indonesia yang natural, santun, dan menyemangati."
        : "You are Noto AI, an empathetic, wise, and friendly personal life coach and companion. You strictly adhere to Noto's privacy-first principle: you have absolutely no direct access to the user's local database, notes, or financial records. You only see and process the minimal, aggregated summary text that the user has explicitly consented to share and send within this chat conversation. Never claim to have direct or automatic access to their private local database. Answer warmly, provide actionable and helpful advice, show empathy, and keep your tone deeply inspiring. Always communicate in a natural and friendly English tone.";

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

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        return res.status(400).json({ error: "missing_api_key" });
      }
      res.status(500).json({ error: error.message || "An error occurred during AI processing" });
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
