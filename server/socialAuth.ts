/**
 * Social OAuth providers: Google and Facebook
 * Handles OAuth code exchange, user info retrieval, and session creation
 */
import type { Express, Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import * as db from "./db";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cryptographically secure OAuth state parameter
 * and set it as an httpOnly cookie for validation in the callback.
 */
function setOAuthState(res: Response, req: Request): string {
  const state = randomBytes(32).toString("hex");
  const cookieOpts = getSessionCookieOptions(req);
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...cookieOpts,
    maxAge: OAUTH_STATE_MAX_AGE,
  });
  return state;
}

/**
 * Validate the OAuth state parameter from the callback against the stored cookie.
 * Clears the state cookie after validation.
 */
function validateOAuthState(req: Request, res: Response): boolean {
  const stateFromQuery = req.query.state as string | undefined;
  const cookieHeader = req.headers.cookie || "";
  const stateMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${OAUTH_STATE_COOKIE}=([^;]+)`));
  const stateFromCookie = stateMatch?.[1];

  // Clear the state cookie regardless
  const cookieOpts = getSessionCookieOptions(req);
  res.clearCookie(OAUTH_STATE_COOKIE, cookieOpts);

  if (!stateFromQuery || !stateFromCookie) return false;
  // Constant-time comparison to prevent timing attacks
  if (stateFromQuery.length !== stateFromCookie.length) return false;
  const a = Buffer.from(stateFromQuery);
  const b = Buffer.from(stateFromCookie);
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}

// ============================================
// GOOGLE OAUTH
// ============================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleRedirectUri(req: Request): string {
  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/auth/google/callback`;
}

async function exchangeGoogleCode(code: string, redirectUri: string) {
  const { data } = await axios.post(GOOGLE_TOKEN_URL, {
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  return data; // { access_token, id_token, expires_in, token_type }
}

async function getGoogleUserInfo(accessToken: string) {
  const { data } = await axios.get(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data; // { id, email, verified_email, name, given_name, family_name, picture }
}

// ============================================
// FACEBOOK OAUTH
// ============================================

const FACEBOOK_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";
const FACEBOOK_USERINFO_URL = "https://graph.facebook.com/v19.0/me";

function getFacebookRedirectUri(req: Request): string {
  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/auth/facebook/callback`;
}

async function exchangeFacebookCode(code: string, redirectUri: string) {
  const { data } = await axios.get(FACEBOOK_TOKEN_URL, {
    params: {
      client_id: ENV.facebookAppId,
      client_secret: ENV.facebookAppSecret,
      redirect_uri: redirectUri,
      code,
    },
  });
  return data; // { access_token, token_type, expires_in }
}

async function getFacebookUserInfo(accessToken: string) {
  const { data } = await axios.get(FACEBOOK_USERINFO_URL, {
    params: {
      fields: "id,name,email,picture.type(large)",
      access_token: accessToken,
    },
  });
  return data; // { id, name, email, picture: { data: { url } } }
}

// ============================================
// SESSION HELPERS
// ============================================

function createSessionToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    ENV.jwtSecret,
    { expiresIn: "7d" } // Align with session security policy (was 365d)
  );
}

// ============================================
// ROUTE REGISTRATION
// ============================================

export function registerSocialAuthRoutes(app: Express) {
  // ---- Google OAuth ----

  // Step 1: Redirect to Google consent screen
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      return res.status(503).json({ error: "Google OAuth not configured" });
    }

    const redirectUri = getGoogleRedirectUri(req);
    const state = setOAuthState(res, req);

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
      prompt: "consent",
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Handle Google callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/?error=google_auth_failed");
    }

    // Validate state parameter to prevent CSRF
    if (!validateOAuthState(req, res)) {
      console.error("[Google OAuth] State parameter mismatch — possible CSRF attack");
      return res.redirect("/?error=google_auth_failed");
    }

    try {
      const redirectUri = getGoogleRedirectUri(req);
      const tokenData = await exchangeGoogleCode(code, redirectUri);
      const googleUser = await getGoogleUserInfo(tokenData.access_token);

      if (!googleUser.email) {
        return res.redirect("/?error=google_no_email");
      }

      // Upsert user — link by email or create new
      await db.upsertUser({
        email: googleUser.email,
        name: googleUser.name || null,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || null,
        authProvider: "google",
        loginMethod: "google",
        emailVerified: googleUser.verified_email || false,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(googleUser.email);
      if (!user) {
        return res.redirect("/?error=user_creation_failed");
      }


      // Create session
      const sessionToken = createSessionToken(user.id, user.email);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to onboarding if profile not complete
      if (!user.profileCompleted) {
        return res.redirect("/onboarding");
      }

      res.redirect("/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.redirect("/?error=google_auth_failed");
    }
  });

  // ---- Facebook OAuth ----

  // Step 1: Redirect to Facebook consent screen
  app.get("/api/auth/facebook", (req: Request, res: Response) => {
    if (!ENV.facebookAppId) {
      return res.status(503).json({ error: "Facebook OAuth not configured" });
    }

    const redirectUri = getFacebookRedirectUri(req);
    const state = setOAuthState(res, req);

    const params = new URLSearchParams({
      client_id: ENV.facebookAppId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email,public_profile",
      state,
    });

    res.redirect(`${FACEBOOK_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Handle Facebook callback
  app.get("/api/auth/facebook/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/?error=facebook_auth_failed");
    }

    // Validate state parameter to prevent CSRF
    if (!validateOAuthState(req, res)) {
      console.error("[Facebook OAuth] State parameter mismatch — possible CSRF attack");
      return res.redirect("/?error=facebook_auth_failed");
    }

    try {
      const redirectUri = getFacebookRedirectUri(req);
      const tokenData = await exchangeFacebookCode(code, redirectUri);
      const fbUser = await getFacebookUserInfo(tokenData.access_token);

      if (!fbUser.email) {
        return res.redirect("/?error=facebook_no_email");
      }

      const avatarUrl = fbUser.picture?.data?.url || null;

      // Upsert user — link by email or create new
      await db.upsertUser({
        email: fbUser.email,
        name: fbUser.name || null,
        facebookId: fbUser.id,
        avatarUrl,
        authProvider: "facebook",
        loginMethod: "facebook",
        emailVerified: true, // Facebook verifies emails
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(fbUser.email);
      if (!user) {
        return res.redirect("/?error=user_creation_failed");
      }


      // Create session
      const sessionToken = createSessionToken(user.id, user.email);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to onboarding if profile not complete
      if (!user.profileCompleted) {
        return res.redirect("/onboarding");
      }

      res.redirect("/");
    } catch (error) {
      console.error("[Facebook OAuth] Callback failed:", error);
      res.redirect("/?error=facebook_auth_failed");
    }
  });

  // ---- Auth status endpoint ----
  // Returns which providers are configured (for frontend to show/hide buttons)
  app.get("/api/auth/providers", (_req: Request, res: Response) => {
    res.json({
      manus: true, // Always available
      google: !!ENV.googleClientId,
      facebook: !!ENV.facebookAppId,
      email: true, // Always available
    });
  });
}
