import { Request, Response } from 'express';
import { constructWebhookEvent } from './stripe';
import * as db from './db';

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  try {
    const event = constructWebhookEvent(req.body, signature);

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Handle test events
    if (event.id.startsWith('evt_test_')) {
      console.log('[Webhook] Test event detected, returning verification response');
      return res.json({ verified: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('[Webhook] Checkout session completed:', session.id);

        // Extract metadata
        const orderId = session.metadata?.order_id;
        const paymentIntentId = session.payment_intent as string;

        if (orderId) {
          // Update order payment status
          await db.updateOrderPaymentStatus(Number(orderId), 'paid');
          console.log(`[Webhook] Order ${orderId} marked as paid`);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[Webhook] Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('[Webhook] Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error processing webhook:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
