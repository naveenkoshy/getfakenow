/**
 * Custom email/password authentication helpers
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

/**
 * Create a new user with email/password
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await hashPassword(data.password);

  const result = await db.insert(users).values({
    email: data.email,
    passwordHash,
    name: data.name || null,
    loginMethod: "email",
    role: "user",
    emailVerified: false,
  });

  return result;
}

/**
 * Update user's last sign-in timestamp
 */
export async function updateLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Set password reset token
 */
export async function setResetToken(email: string, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour

  await db
    .update(users)
    .set({
      resetToken: token,
      resetTokenExpiry: expiry,
    })
    .where(eq(users.email, email));
}

/**
 * Verify reset token and get user
 */
export async function verifyResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token));

  const user = result[0];
  if (!user || !user.resetTokenExpiry) return null;

  // Check if token is expired
  if (new Date() > user.resetTokenExpiry) return null;

  return user;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await verifyResetToken(token);
  if (!user) throw new Error("Invalid or expired reset token");

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  return user;
}
