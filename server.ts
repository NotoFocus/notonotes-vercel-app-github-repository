import express from "express";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
