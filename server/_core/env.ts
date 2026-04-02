const isProduction = process.env.NODE_ENV === "production";

/**
 * Validate that a required environment variable is set.
 * In production, throws an error. In development, logs a warning.
 */
function requireEnv(name: string, value: string | undefined, minLength = 1): string {
  if (!value || value.length < minLength) {
    const msg = `[SECURITY] Missing or invalid environment variable: ${name} (minimum ${minLength} chars)`;
    if (isProduction) {
      throw new Error(msg);
    }
    console.warn(msg);
    return value ?? "";
  }
  return value;
}

// Validate critical secrets on module load
const jwtSecret = requireEnv("JWT_SECRET", process.env.JWT_SECRET, 32);
const databaseUrl = requireEnv("DATABASE_URL", process.env.DATABASE_URL, 10);
const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY, 10);
const stripeWebhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET, 10);

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  siteUrl: process.env.VITE_SITE_URL || process.env.SITE_URL || "https://getfakenow.com",
  cookieSecret: jwtSecret,
  jwtSecret,
  databaseUrl,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey,
  stripeWebhookSecret,
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Facebook OAuth
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
};
