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

/**
 * Send admin invite email with a setup link
 */
export async function sendAdminInviteEmail(email: string, token: string, inviterName: string): Promise<boolean> {
  const siteUrl = ENV.siteUrl || "http://localhost:3000";
  const setupUrl = `${siteUrl}/admin/setup?token=${token}`;

  return sendEmail({
    to: email,
    subject: "You've Been Invited as Admin — Fake by Freetown",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Admin Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the Fake by Freetown admin team.</p>
        <p>Click the link below to set up your admin account. This invite expires in 7 days.</p>
        <p style="margin: 24px 0;">
          <a href="${setupUrl}" style="background: #e63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Set Up Admin Account
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">If you weren't expecting this invite, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">Setup link: ${setupUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Fake by Freetown — Premium apparel for people who get the joke.</p>
      </div>
    `,
    text: `You've been invited as an admin by ${inviterName}.\n\nSet up your account: ${setupUrl}\n\nThis invite expires in 7 days.`,
  });
}

/**
 * Send refund confirmation email to customer
 * Enhanced with detailed breakdown, reason, timeline, and brand voice
 */
export async function sendRefundEmail(
  email: string,
  orderNumber: string,
  refundAmount: number,
  isPartial: boolean,
  origin: string,
  options?: {
    orderTotal?: number;
    reason?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    customerName?: string;
  }
): Promise<boolean> {
  const orderUrl = `${origin}/orders`;
  const refundType = isPartial ? "Partial Refund" : "Full Refund";
  const greeting = options?.customerName ? `Hi ${options.customerName.split(' ')[0]},` : 'Hi there,';

  const reasonLabels: Record<string, string> = {
    requested_by_customer: 'Customer request',
    defective_item: 'Defective / damaged item',
    wrong_item: 'Wrong item sent',
    not_as_described: 'Item not as described',
    size_issue: 'Size / fit issue',
    late_delivery: 'Late delivery',
    duplicate_order: 'Duplicate order',
    other: 'Other',
  };
  const reasonText = options?.reason ? (reasonLabels[options.reason] || options.reason) : '';

  // Build items table if available
  let itemsHtml = '';
  if (options?.items && options.items.length > 0) {
    const rows = options.items.map(item =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;">${item.name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">x${item.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">RM ${(item.price / 100).toFixed(2)}</td></tr>`
    ).join('');
    itemsHtml = `
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead><tr style="background:#f9fafb;"><th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280;">Item</th><th style="padding:6px 8px;text-align:center;font-size:12px;color:#6b7280;">Qty</th><th style="padding:6px 8px;text-align:right;font-size:12px;color:#6b7280;">Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Build order total comparison for partial refunds
  let totalComparisonHtml = '';
  if (isPartial && options?.orderTotal) {
    const pct = ((refundAmount / options.orderTotal) * 100).toFixed(0);
    totalComparisonHtml = `
      <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #d1fae5;">
        <span style="font-size:12px;color:#6b7280;">Original order total</span>
        <span style="font-size:12px;color:#6b7280;">RM ${(options.orderTotal / 100).toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:12px;color:#6b7280;">Refund percentage</span>
        <span style="font-size:12px;color:#6b7280;">${pct}%</span>
      </div>
    `;
  }

  return sendEmail({
    to: email,
    subject: `${refundType} Processed — Order ${orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <!-- Header -->
        <div style="text-align: center; padding: 24px 0 16px;">
          <h1 style="font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 2px;">FAKE <span style="font-weight: 400; font-size: 14px;">by Freetown</span></h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 0 24px;">
          <p style="font-size: 15px; line-height: 1.6;">${greeting}</p>
          <p style="font-size: 15px; line-height: 1.6;">
            We've processed your ${isPartial ? 'partial' : 'full'} refund for order <strong>${orderNumber}</strong>.
            ${reasonText ? `<br/>Reason: <em>${reasonText}</em>` : ''}
          </p>

          <!-- Refund Amount Card -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Refund Amount</p>
              <p style="margin: 0; font-weight: 700; font-size: 28px; color: #16a34a;">RM ${(refundAmount / 100).toFixed(2)}</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${refundType}</p>
            </div>
            ${totalComparisonHtml}
          </div>

          ${itemsHtml ? `<p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Items in this order:</p>${itemsHtml}` : ''}

          <!-- Timeline -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">What happens next?</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#16a34a;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">1</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Refund initiated</strong> — Done! We've sent the refund to Stripe.</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#d1d5db;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">2</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Processing</strong> — Stripe processes the refund (1-3 business days).</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#d1d5db;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">3</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Back in your account</strong> — Funds appear on your statement (5-10 business days total).</td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${orderUrl}" style="background: #e63946; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">View Your Orders</a>
          </p>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
            Questions about your refund? Just reply to this email or reach out to our support team. We're here to help.
          </p>
        </div>

        <!-- Footer -->
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <div style="text-align: center; padding: 0 24px 24px;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">Fake by Freetown — Premium apparel for people who get the joke.</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">We put 'Fake' on the label so you'd never have to question what's real.</p>
        </div>
      </div>
    `,
    text: `${greeting}\n\n${refundType} Processed\nOrder: ${orderNumber}\nRefund Amount: RM ${(refundAmount / 100).toFixed(2)}${reasonText ? `\nReason: ${reasonText}` : ''}\n\nWhat happens next:\n1. Refund initiated — Done!\n2. Processing — 1-3 business days via Stripe\n3. Back in your account — 5-10 business days total\n\nView orders: ${orderUrl}\n\nFake by Freetown — Premium apparel for people who get the joke.`,
  });
}

/**
 * Send return request acknowledgment email to customer
 * Triggered when a customer initiates a return request
 */
export async function sendReturnRequestAcknowledgmentEmail(
  email: string,
  orderNumber: string,
  reason: string,
  origin: string,
  options?: {
    customerName?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    orderTotal?: number;
  }
): Promise<boolean> {
  const orderUrl = `${origin}/orders`;
  const greeting = options?.customerName ? `Hi ${options.customerName.split(' ')[0]},` : 'Hi there,';

  let itemsHtml = '';
  if (options?.items && options.items.length > 0) {
    const rows = options.items.map(item =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;">${item.name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">x${item.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">RM ${(item.price / 100).toFixed(2)}</td></tr>`
    ).join('');
    itemsHtml = `
      <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;">Items in this order:</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <thead><tr style="background:#f9fafb;"><th style="padding:6px 8px;text-align:left;font-size:12px;color:#6b7280;">Item</th><th style="padding:6px 8px;text-align:center;font-size:12px;color:#6b7280;">Qty</th><th style="padding:6px 8px;text-align:right;font-size:12px;color:#6b7280;">Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  return sendEmail({
    to: email,
    subject: `Return Request Received \u2014 Order ${orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <!-- Header -->
        <div style="text-align: center; padding: 24px 0 16px;">
          <h1 style="font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 2px;">FAKE <span style="font-weight: 400; font-size: 14px;">by Freetown</span></h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 0 24px;">
          <p style="font-size: 15px; line-height: 1.6;">${greeting}</p>
          <p style="font-size: 15px; line-height: 1.6;">
            We've received your return request for order <strong>${orderNumber}</strong>. Our team will review it and get back to you shortly.
          </p>

          <!-- Request Details Card -->
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #92400e;">Return Request</p>
              <p style="margin: 0; font-weight: 700; font-size: 18px; color: #92400e;">Under Review</p>
            </div>
          </div>

          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">Your reason for return:</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">"${reason}"</p>
          </div>

          ${itemsHtml}

          <!-- Timeline -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151;">What happens next?</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#16a34a;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">1</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Request received</strong> \u2014 Done! We have your return request.</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#d1d5db;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">2</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Review</strong> \u2014 Our team reviews your request (1-2 business days).</td>
              </tr>
              <tr>
                <td style="padding:4px 8px 4px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#d1d5db;color:white;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;">3</span>
                </td>
                <td style="padding:4px 0;font-size:13px;color:#374151;"><strong>Decision</strong> \u2014 We'll email you with the outcome and next steps.</td>
              </tr>
            </table>
          </div>

          <p style="text-align: center; margin: 24px 0;">
            <a href="${orderUrl}" style="background: #e63946; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">View Your Orders</a>
          </p>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
            Need to add more details? Just reply to this email or reach out to our support team. We're here to help.
          </p>
        </div>

        <!-- Footer -->
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <div style="text-align: center; padding: 0 24px 24px;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">Fake by Freetown \u2014 Premium apparel for people who get the joke.</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">We put 'Fake' on the label so you'd never have to question what's real.</p>
        </div>
      </div>
    `,
    text: `${greeting}\n\nReturn Request Received\nOrder: ${orderNumber}\nStatus: Under Review\n\nYour reason: "${reason}"\n\nWhat happens next:\n1. Request received \u2014 Done!\n2. Review \u2014 1-2 business days\n3. Decision \u2014 We'll email you with the outcome\n\nView orders: ${orderUrl}\n\nFake by Freetown \u2014 Premium apparel for people who get the joke.`,
  });
}
