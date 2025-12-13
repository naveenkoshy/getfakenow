import { Request, Response } from 'express';
import { constructStripeEvent, handleStripeWebhook as processWebhook } from './stripeWebhook';

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  try {
    // Verify webhook signature and construct event
    const event = constructStripeEvent(req.body, signature);

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Handle test events
    if (event.id.startsWith('evt_test_')) {
      console.log('[Webhook] Test event detected, returning verification response');
      return res.json({ verified: true });
    }

    // Process webhook event (handles order status update + inventory deduction)
    const result = await processWebhook(event);
    res.json(result);
  } catch (err) {
    console.error('[Webhook] Error processing webhook:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
