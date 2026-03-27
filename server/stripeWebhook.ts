import Stripe from "stripe";
import * as db from "./db";
import { constructWebhookEvent } from "./stripe";
import { sendOrderConfirmationEmail } from "./email";

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

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      return { success: true, message: "Checkout session expired — stock released" };
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
      return { success: true, message: "Payment intent succeeded" };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      return { success: true, message: "Payment intent failed" };
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return { success: true, message: `Unhandled event type: ${event.type}` };
  }
}

/**
 * Handle successful checkout session completion
 * - Update order status from "pending" to "processing"
 * - Send order confirmation email
 * 
 * NOTE: Stock was already reserved (decremented) at checkout session creation time
 * inside a database transaction with row-level locking. No stock changes needed here.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;
  const orderNumber = session.metadata?.order_number;

  if (!orderId) {
    console.error("[Stripe Webhook] No orderId in session metadata");
    return;
  }

  console.log(`[Stripe Webhook] Processing completed checkout for order ${orderId}`);

  try {
    const database = await db.getDb();
    if (!database) throw new Error("Database connection failed");

    const { orders, orderItems } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get order details
    const [order] = await database
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (!order) {
      console.error(`[Stripe Webhook] Order ${orderId} not found`);
      return;
    }

    // Update order status to "processing" and payment to "paid"
    await database
      .update(orders)
      .set({
        status: "processing",
        paymentStatus: "paid",
        paymentIntentId: session.payment_intent as string || null,
      })
      .where(eq(orders.id, parseInt(orderId)));

    console.log(`[Stripe Webhook] Order ${orderId} updated to Processing/Paid`);

    // Send order confirmation email
    try {
      const items = await database
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, parseInt(orderId)));

      const origin = session.success_url?.split("/order-confirmation")[0] || (process.env.VITE_SITE_URL || "https://getfakenow.com");
      await sendOrderConfirmationEmail(
        order.shippingEmail,
        order.orderNumber,
        order.totalAmount,
        items.map((i) => ({ name: i.productName, quantity: i.quantity, price: i.productPrice * i.quantity })),
        origin
      );
      console.log(`[Stripe Webhook] Order confirmation email sent for ${order.orderNumber}`);
    } catch (emailErr) {
      console.warn("[Stripe Webhook] Failed to send confirmation email:", emailErr);
      // Non-fatal: order is still processed
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error processing checkout:", error);
    throw error;
  }
}

/**
 * Handle expired checkout session
 * - Release reserved stock by incrementing quantities back
 * - Cancel the pending order
 * 
 * This ensures stock is not permanently locked when a customer abandons checkout.
 */
async function handleCheckoutExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error("[Stripe Webhook] No orderId in expired session metadata");
    return;
  }

  console.log(`[Stripe Webhook] Releasing stock for expired session, order ${orderId}`);

  try {
    const database = await db.getDb();
    if (!database) throw new Error("Database connection failed");

    const { orders, orderItems, products } = await import("../drizzle/schema");
    const { eq, sql: sqlOp } = await import("drizzle-orm");

    // Get order to check it's still pending (not already processed)
    const [order] = await database
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(orderId)))
      .limit(1);

    if (!order) {
      console.error(`[Stripe Webhook] Order ${orderId} not found for stock release`);
      return;
    }

    // Only release stock if the order is still pending (not already paid/processed)
    if (order.paymentStatus !== "pending") {
      console.log(`[Stripe Webhook] Order ${orderId} already processed (${order.paymentStatus}), skipping stock release`);
      return;
    }

    // Get order items and restore stock
    const items = await database
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, parseInt(orderId)));

    for (const item of items) {
      await database.execute(
        sqlOp`UPDATE products SET stockQuantity = stockQuantity + ${item.quantity} WHERE id = ${item.productId}`
      );
      console.log(`[Stripe Webhook] Restored ${item.quantity} units to product ${item.productId}`);
    }

    // Cancel the order
    await database
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "failed",
      })
      .where(eq(orders.id, parseInt(orderId)));

    console.log(`[Stripe Webhook] Order ${orderId} cancelled, stock released`);
  } catch (error) {
    console.error("[Stripe Webhook] Error releasing stock:", error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 * Re-export from stripe.ts for convenience
 */
export { constructWebhookEvent as constructStripeEvent } from "./stripe";
