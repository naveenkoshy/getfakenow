import Stripe from "stripe";
import * as db from "./db";
import { constructWebhookEvent } from "./stripe";

/**
 * Handle Stripe webhook events
 * Called from Express webhook endpoint
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      return { success: true, message: "Checkout session completed" };
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
      return { success: true, message: "Payment intent succeeded" };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      // TODO: Handle failed payment (update order status, notify customer)
      return { success: true, message: "Payment intent failed" };
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return { success: true, message: `Unhandled event type: ${event.type}` };
  }
}

/**
 * Handle successful checkout session completion
 * - Update order status from "Pending" to "Processing"
 * - Deduct inventory for ordered items
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error("[Stripe Webhook] No orderId in session metadata");
    return;
  }

  console.log(`[Stripe Webhook] Processing order ${orderId}`);

  try {
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database connection failed");
    }

    const { orders, orderItems, products } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get order details
    const order = await database
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (!order || order.length === 0) {
      console.error(`[Stripe Webhook] Order ${orderId} not found`);
      return;
    }

    // Get order items
    const items = await database
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, parseInt(orderId)));

    // Deduct inventory for each item
    for (const item of items) {
      const currentProduct = await database
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (currentProduct && currentProduct.length > 0) {
        const newStock = currentProduct[0].stockQuantity - item.quantity;
        await database
          .update(products)
          .set({ stockQuantity: newStock })
          .where(eq(products.id, item.productId));
      }

      console.log(
        `[Stripe Webhook] Deducted ${item.quantity} units from product ${item.productId}`
      );
    }

    // Update order status to "processing"
    await database
      .update(orders)
      .set({
        status: "processing",
        paymentStatus: "paid",
      })
      .where(eq(orders.id, parseInt(orderId)));

    console.log(`[Stripe Webhook] Order ${orderId} updated to Processing`);

    // TODO: Send order confirmation email to customer
    // await sendOrderConfirmationEmail(order[0]);
  } catch (error) {
    console.error("[Stripe Webhook] Error processing checkout:", error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 * Re-export from stripe.ts for convenience
 */
export { constructWebhookEvent as constructStripeEvent } from "./stripe";
