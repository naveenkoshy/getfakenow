import express from "express";
import { constructStripeEvent, handleStripeWebhook } from "../stripeWebhook";

/**
 * Stripe webhook endpoint
 * Must use raw body parser to verify webhook signature
 */
export function createStripeWebhookEndpoint() {
  const router = express.Router();

  // Stripe webhook endpoint - MUST use raw body
  router.post(
    "/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        console.error("[Stripe Webhook] Missing signature header");
        return res.status(400).send("Missing stripe-signature header");
      }

      try {
        // Verify webhook signature and construct event
        const event = constructStripeEvent(req.body, signature);

        // Handle the webhook event
        const result = await handleStripeWebhook(event);

        res.json(result);
      } catch (error) {
        console.error("[Stripe Webhook] Error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        res.status(400).send(`Webhook Error: ${errorMessage}`);
      }
    }
  );

  return router;
}
