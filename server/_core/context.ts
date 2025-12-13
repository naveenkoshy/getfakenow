import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getUserByEmail } from "../auth";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Try JWT auth first (custom email/password)
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

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
