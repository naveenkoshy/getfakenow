import Stripe from 'stripe';
import { ENV } from './_core/env';

if (!ENV.stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2025-11-17.clover',
});

/**
 * Create a Stripe Checkout Session for cart checkout
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  items: Array<{
    name: string;
    description?: string;
    price: number; // in cents
    quantity: number;
    images?: string[];
  }>;
  origin: string;
  orderId?: number;
  orderNumber?: string;
}) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => ({
    price_data: {
      currency: 'myr',
      product_data: {
        name: item.name,
        description: item.description,
        images: item.images,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${params.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/cart`,
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      order_id: params.orderId?.toString() || '',
      order_number: params.orderNumber || '',
    },
  });

  return session;
}

/**
 * Issue a refund via Stripe
 * @param paymentIntentId - The Stripe PaymentIntent ID to refund
 * @param amount - Amount in cents (sen) to refund. If omitted, full refund.
 * @param reason - Reason for refund
 * @returns Stripe Refund object
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number;
  reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent';
  metadata?: Record<string, string>;
}) {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: params.paymentIntentId,
    reason: params.reason || 'requested_by_customer',
    metadata: params.metadata,
  };

  // If amount is specified, it's a partial refund
  if (params.amount !== undefined) {
    refundParams.amount = params.amount;
  }

  const refund = await stripe.refunds.create(refundParams);
  return refund;
}

/**
 * Verify webhook signature and construct event
 */
export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  if (!ENV.stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret
  );
}
