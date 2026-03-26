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

Sitemap: https://getfakenow.com/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  // Image upload endpoint
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image || !filename) {
        return res.status(400).json({ error: "Missing image or filename" });
      }

      // Extract base64 data
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Generate unique filename
      const ext = filename.split(".").pop();
      const uniqueFilename = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload to S3
      const { storagePut } = await import("../storage");
      const { url } = await storagePut(uniqueFilename, buffer, `image/${ext}`);

      res.json({ url });
    } catch (error) {
      console.error("[Upload] Error uploading image:", error);
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
