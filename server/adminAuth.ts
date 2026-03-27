/**
 * Admin-specific authentication helpers
 * Separate from customer auth with stronger security policies.
 * Fully portable — no hard-coded URLs or platform-specific dependencies.
 */
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_MS, ADMIN_SESSION_JWT_EXPIRY } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import type { Request, Response } from "express";
import { getUserByEmail, verifyPassword } from "./auth";

/**
 * Validate admin password strength (stricter than customer passwords)
 * Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function isValidAdminPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 12) {
    return { valid: false, message: "Admin password must be at least 12 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Admin password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Admin password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Admin password must contain at least one number" };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Admin password must contain at least one special character" };
  }
  return { valid: true, message: "Password meets requirements" };
}

/**
 * Issue an admin-specific JWT token and set it as a separate cookie.
 * Uses a different cookie name and shorter expiry than customer sessions.
 */
export function issueAdminSession(req: Request, res: Response, userId: number, email: string): string {
  const token = jwt.sign(
    { userId, email, isAdmin: true, iat: Math.floor(Date.now() / 1000) },
    ENV.jwtSecret,
    { expiresIn: ADMIN_SESSION_JWT_EXPIRY }
  );

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(ADMIN_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: ADMIN_SESSION_MAX_AGE_MS,
  });

  return token;
}

/**
 * Refresh admin session — extends the sliding window timeout.
 * Called on each authenticated admin request.
 */
export function refreshAdminSession(req: Request, res: Response, userId: number, email: string): void {
  issueAdminSession(req, res, userId, email);
}

/**
 * Clear admin session cookie
 */
export function clearAdminSession(req: Request, res: Response): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

/**
 * Verify admin session from request cookies.
 * Returns decoded token payload or null if invalid/expired.
 */
export function verifyAdminSession(req: Request): { userId: number; email: string; isAdmin: boolean } | null {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as {
      userId: number;
      email: string;
      isAdmin: boolean;
    };
    if (!decoded.isAdmin) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Authenticate an admin login attempt.
 * Validates credentials and role, then issues admin session.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
  req: Request,
  res: Response
): Promise<{ success: boolean; error?: string; user?: { id: number; email: string; name: string | null; role: string } }> {
  const user = await getUserByEmail(email);

  if (!user || !user.passwordHash) {
    return { success: false, error: "Invalid email or password" };
  }

  if (user.role !== "admin") {
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  issueAdminSession(req, res, user.id, user.email);

  return {
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
