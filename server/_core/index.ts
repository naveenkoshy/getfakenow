import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSocialAuthRoutes } from "../socialAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateSitemapXml } from "../sitemap";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered before express.json() to preserve raw body
  const { handleStripeWebhook } = await import("../webhookHandler");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Trust proxy for accurate IP detection behind reverse proxy
  app.set('trust proxy', 1);

  // ── Security Headers ──────────────────────────────────────
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // XSS protection (legacy browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // HSTS in production
    if (ENV.isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    // Content Security Policy
    res.setHeader("Content-Security-Policy", [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://*.googleapis.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "));
    next();
  });

  // ── CORS ──────────────────────────────────────────────────
  const allowedOrigins = [ENV.siteUrl, "http://localhost:3000", "http://localhost:5173"].filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // Rate limiting on auth and API endpoints
  const { registerRateLimiters } = await import("../rateLimit");
  registerRateLimiters(app);
  // SEO: Sitemap and robots.txt
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const sitemap = await generateSitemapXml();
      res.header("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("[Sitemap] Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${ENV.siteUrl.replace(/\/$/, '')}/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  // Image upload endpoint (secured)
  const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"]);
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB per file

  app.post("/api/upload-image", async (req, res) => {
    try {
      // ── Auth check: require valid JWT ──
      const cookieHeader = req.headers.cookie || "";
      const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      const adminMatch = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
      const token = adminMatch?.[1] || tokenMatch?.[1];
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }
      try {
        const jwt = await import("jsonwebtoken");
        jwt.default.verify(token, ENV.jwtSecret);
      } catch {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      const { image, filename } = req.body;
      if (!image || !filename) {
        return res.status(400).json({ error: "Missing image or filename" });
      }

      // ── File extension whitelist ──
      const ext = (filename.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
        return res.status(400).json({ error: `File type .${ext} not allowed. Accepted: ${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(", ")}` });
      }

      // ── Extract and validate base64 data ──
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // ── Size limit ──
      if (buffer.length > MAX_UPLOAD_SIZE) {
        return res.status(400).json({ error: `File too large. Maximum ${MAX_UPLOAD_SIZE / 1024 / 1024}MB allowed.` });
      }

      // Generate unique filename with sanitized extension
      const uniqueFilename = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload to S3
      const { storagePut } = await import("../storage");
      const { url } = await storagePut(uniqueFilename, buffer, `image/${ext}`);

      res.json({ url });
    } catch (error) {
      console.error("[Upload] Error:", ENV.isProduction ? (error as Error).message : error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Social OAuth (Google, Facebook)
  registerSocialAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
