import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getUserByEmail } from "../auth";
import { COOKIE_NAME, ADMIN_COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isAdminSession: boolean; // true when authenticated via the separate admin cookie
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let isAdminSession = false;

  // 1. Check admin session cookie first (separate from customer auth)
  const adminToken = opts.req.cookies?.[ADMIN_COOKIE_NAME];
  if (adminToken) {
    try {
      const decoded = jwt.verify(adminToken, ENV.jwtSecret) as {
        userId: number;
        email: string;
        isAdmin: boolean;
      };
      if (decoded.isAdmin && decoded.email) {
        const adminUser = await getUserByEmail(decoded.email);
        if (adminUser && adminUser.role === "admin") {
          user = adminUser;
          isAdminSession = true;
        }
      }
    } catch {
      // Admin token expired or invalid — fall through to customer auth
    }
  }

  // 2. If no admin session, try customer JWT auth
  if (!user) {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.jwtSecret) as { userId: number; email: string };
        if (decoded.email) {
          user = await getUserByEmail(decoded.email);
        }
      } catch (jwtError) {
        // JWT verification failed, try OAuth fallback
        try {
          user = await sdk.authenticateRequest(opts.req);
        } catch (oauthError) {
          // Both auth methods failed
          user = null;
        }
      }
    } else {
      // No JWT token, try OAuth
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (error) {
        // Authentication is optional for public procedures.
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isAdminSession,
  };
}
