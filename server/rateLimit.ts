/**
 * Rate Limiting Middleware
 * Protects auth endpoints from brute-force attacks.
 */
import rateLimit from "express-rate-limit";
import type { Express } from "express";

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP
 * Applied to login, register, and password reset endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: {
      message: "Too many attempts. Please try again in 15 minutes.",
      code: "RATE_LIMITED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * General API rate limiter: 100 requests per minute per IP
 * Applied to all /api/trpc endpoints as a safety net.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      message: "Too many requests. Please slow down.",
      code: "RATE_LIMITED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Register rate limiters on the Express app.
 * Must be called AFTER body parsers but BEFORE tRPC middleware.
 */
export function registerRateLimiters(app: Express) {
  // Strict limiter on auth-related tRPC procedures
  // tRPC batches requests under /api/trpc, so we match the procedure names in the URL
  app.use("/api/trpc/auth.login", authRateLimiter);
  app.use("/api/trpc/auth.register", authRateLimiter);
  app.use("/api/trpc/auth.requestPasswordReset", authRateLimiter);

  // General rate limiter on all API endpoints
  app.use("/api/trpc", apiRateLimiter);
}
