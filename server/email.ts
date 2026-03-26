/**
 * Email Service
 * Uses the platform's built-in notification system to send transactional emails.
 * This replaces the previous console.log approach for password reset tokens.
 */
import { ENV } from "./_core/env";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via the platform notification service.
 * Falls back to console.warn if the service is unavailable.
 */
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html, text } = payload;

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn(`[Email] Notification service not configured. Email to ${to}: ${subject}`);
    return false;
  }

  const normalizedBase = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const endpoint = new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        title: `[${to}] ${subject}`,
        content: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Email] Failed to send (${response.status}): ${detail}`);
      return false;
    }

    console.log(`[Email] Sent "${subject}" notification for ${to}`);
    return true;
  } catch (error) {
    console.warn("[Email] Error sending notification:", error);
    return false;
  }
}

/**
 * Send password reset email with a reset link
 */
export async function sendPasswordResetEmail(email: string, token: string, origin: string): Promise<boolean> {
  const resetUrl = `${origin}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset Your Password — Fake by Freetown",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Reset Your Password</h2>
        <p>We received a request to reset your password for your Fake by Freetown account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #e63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">Reset link: ${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Fake by Freetown — Premium apparel for people who get the joke.</p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string, origin: string): Promise<boolean> {
  const verifyUrl = `${origin}/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Verify Your Email — Fake by Freetown",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Verify Your Email</h2>
        <p>Welcome to Fake by Freetown! Please verify your email address to complete your registration.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #e63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">Verification link: ${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Fake by Freetown — Premium apparel for people who get the joke.</p>
      </div>
    `,
    text: `Verify your email: ${verifyUrl}\n\nIf you didn't create an account, ignore this email.`,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  totalAmount: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  origin: string
): Promise<boolean> {
  const orderUrl = `${origin}/orders`;
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">RM ${(item.price / 100).toFixed(2)}</td></tr>`
    )
    .join("");

  return sendEmail({
    to: email,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Order Confirmed!</h2>
        <p>Thank you for your order. Here's a summary:</p>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead><tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;text-align:right;font-weight:bold;">RM ${(totalAmount / 100).toFixed(2)}</td></tr></tfoot>
        </table>
        <p><a href="${orderUrl}" style="color:#e63946;">View your orders</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Fake by Freetown — Premium apparel for people who get the joke.</p>
      </div>
    `,
    text: `Order Confirmed: ${orderNumber}\nTotal: RM ${(totalAmount / 100).toFixed(2)}\nView orders: ${orderUrl}`,
  });
}
