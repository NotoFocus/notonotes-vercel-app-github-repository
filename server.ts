import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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
  function getGeminiClient() {
    const key = process.env.GEMINI_API_KEY;
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

  // 1. AI Chat Companion Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, lang } = req.body;
      const ai = getGeminiClient();
      
      const systemInstruction = lang === 'id' 
        ? "Anda adalah Noto AI, asisten pribadi dan sahabat kehidupan yang berempati, bijaksana, dan ramah. Tugas Anda adalah membantu pengguna mengelola hidup, keuangan, dan produktivitas mereka di aplikasi Noto. Jawablah dengan hangat, gunakan sapaan ramah, berikan saran praktis, dan jaga agar tanggapan Anda menginspirasi. Selalu gunakan Bahasa Indonesia yang natural dan menyemangati."
        : "You are Noto AI, an empathetic, wise, and friendly personal life coach and companion. Your role is to help users manage their life, habits, finance, and productivity in the Noto app. Answer warmly, give actionable and encouraging suggestions, and keep your responses deeply inspiring. Always communicate in a natural and friendly English tone.";

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

  // 2. AI Dashboard Insight Route
  app.post("/api/ai/insight", async (req, res) => {
    try {
      const { userContext, lang } = req.body;
      const ai = getGeminiClient();

      const systemInstruction = lang === 'id'
        ? "Anda adalah Noto AI Advisor. Berdasarkan data produktivitas, keuangan, dan suasana hati (mood) pengguna, buatlah analisis singkat, penuh empati, dan sangat memotivasi dalam format Markdown. Jangan sebutkan variabel internal teknis. Sebutkan pencapaian mereka (misal streak hari, rasio tabungan, tugas selesai) dan berikan saran hangat harian."
        : "You are Noto AI Advisor. Based on the user's productivity, finance, and mood history, generate a brief, deeply empathetic, and highly motivating reflection in Markdown format. Do not reference internal technical structures. Highlight their wins (e.g., streak, savings ratio, task completion) and offer a warm daily coaching insight.";

      const dataPrompt = `
      Berikut data aktivitas terbaruku di Noto:
      - Jumlah Catatan: ${userContext.notesCount}
      - Jumlah Tugas & Kebiasaan Aktif: ${userContext.tasksCount}
      - Streak Check-In Saat Ini: ${userContext.streak} hari
      - Tugas yang Selesai: ${userContext.completedCount}
      - Suasana Hati (Mood) Terakhir: ${userContext.recentMoods.join(", ") || "Belum dicatat"}
      - Progress Target Tabungan: ${userContext.savingsPercent}%

      Tolong berikan:
      1. **Evaluasi Singkat**: Berikan apresiasi hangat atas progres saya hari ini.
      2. **Mindfulness & Mood Boost**: Berikan kutipan penyemangat atau tips sesuai suasana hati terakhir saya.
      3. **Aksi Kecil Hari Ini**: Berikan satu tantangan kecil yang positif dan gampang dilakukan agar hari ini terasa lebih terorganisir dan menyenangkan.
      `;

      const response = await generateContentWithFallback(ai, {
        contents: dataPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ insight: response.text });
    } catch (error: any) {
      console.error("AI Insight Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        return res.status(400).json({ error: "missing_api_key" });
      }
      res.status(500).json({ error: error.message || "An error occurred during AI processing" });
    }
  });

  // 3. AI Habit / Task Suggestion Route
  app.post("/api/ai/suggest-tasks", async (req, res) => {
    try {
      const { goal, lang } = req.body;
      const ai = getGeminiClient();

      const prompt = lang === 'id'
        ? `Buat daftar 3 sampai 4 kebiasaan atau tugas harian mikro yang dapat membantu saya mencapai tujuan berikut: "${goal}". Pastikan judul tugas singkat, padat, dan jelas, serta tambahkan instruksi singkat yang praktis di bagian catatan.`
        : `Create a list of 3 to 4 micro daily habits or actions to help me achieve this goal: "${goal}". Ensure task titles are actionable and concise, and add practical short instructions in the notes.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                description: "List of recommended daily habits or actions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "The direct, brief title of the micro-habit or task"
                    },
                    notes: {
                      type: Type.STRING,
                      description: "Short actionable instruction or encouragement"
                    },
                    repeat: {
                      type: Type.STRING,
                      description: "Must be either 'daily' or 'once'"
                    },
                    isDiscipline: {
                      type: Type.BOOLEAN,
                      description: "True if this is a high-discipline commitment habit, false if it's a regular task"
                    }
                  },
                  required: ["title", "notes", "repeat", "isDiscipline"]
                 }
               }
             },
             required: ["tasks"]
           }
         }
       });

       res.json(JSON.parse(response.text || "{\"tasks\":[]}"));
     } catch (error: any) {
       console.error("AI Task Suggestion Error:", error);
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
