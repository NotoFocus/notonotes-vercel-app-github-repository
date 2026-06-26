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
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"], // Removed unsafe-eval for strict CSP
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "https:", "wss:", "https://vitals.vercel-insights.com"], // Restricted connect sources
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      } : false,
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
      frameguard: false, // Prevents Clickjacking but breaks AI Studio iframe preview
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}`);
  });
}

startServer();
