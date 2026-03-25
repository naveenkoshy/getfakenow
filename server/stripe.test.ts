import { describe, expect, it, vi } from "vitest";

// Mock Stripe before importing the module
vi.mock("stripe", () => {
  const mockCreate = vi.fn().mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/test",
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCreate,
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    stripeSecretKey: "sk_test_fake_key",
    stripeWebhookSecret: "whsec_test_fake_secret",
  },
}));

describe("Stripe integration", () => {
  it("uses MYR currency for checkout sessions", async () => {
    // Dynamic import after mocks are set up
    const { createCheckoutSession } = await import("./stripe");
    const Stripe = (await import("stripe")).default;

    const stripeInstance = new Stripe("sk_test_fake_key");
    const mockCreate = stripeInstance.checkout.sessions.create as ReturnType<typeof vi.fn>;

    await createCheckoutSession({
      userId: 1,
      userEmail: "test@example.com",
      userName: "Test User",
      items: [
        {
          name: "Test Tee",
          description: "A test product",
          price: 3500,
          quantity: 1,
          images: ["https://example.com/image.jpg"],
        },
      ],
      origin: "https://example.com",
      orderId: 1,
      orderNumber: "ORD-001",
    });

    // Verify the create function was called
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Check the arguments passed to stripe.checkout.sessions.create
    const createArgs = mockCreate.mock.calls[0][0];

    // Verify currency is MYR
    expect(createArgs.line_items[0].price_data.currency).toBe("myr");

    // Verify other key parameters
    expect(createArgs.mode).toBe("payment");
    expect(createArgs.customer_email).toBe("test@example.com");
    expect(createArgs.client_reference_id).toBe("1");
    expect(createArgs.allow_promotion_codes).toBe(true);
    expect(createArgs.metadata.user_id).toBe("1");
    expect(createArgs.metadata.customer_email).toBe("test@example.com");
    expect(createArgs.metadata.order_number).toBe("ORD-001");

    // Verify success and cancel URLs
    expect(createArgs.success_url).toContain("order-confirmation");
    expect(createArgs.cancel_url).toBe("https://example.com/cart");
  });

  it("passes correct line items with price in cents", async () => {
    const { createCheckoutSession } = await import("./stripe");
    const Stripe = (await import("stripe")).default;

    const stripeInstance = new Stripe("sk_test_fake_key");
    const mockCreate = stripeInstance.checkout.sessions.create as ReturnType<typeof vi.fn>;
    mockCreate.mockClear();

    await createCheckoutSession({
      userId: 2,
      userEmail: "buyer@example.com",
      userName: "Buyer",
      items: [
        { name: "Dress Shirt", price: 8900, quantity: 2 },
        { name: "Silk Tie", price: 5900, quantity: 1 },
      ],
      origin: "https://store.example.com",
    });

    const createArgs = mockCreate.mock.calls[0][0];

    // Two line items
    expect(createArgs.line_items).toHaveLength(2);

    // First item
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(8900);
    expect(createArgs.line_items[0].quantity).toBe(2);
    expect(createArgs.line_items[0].price_data.product_data.name).toBe("Dress Shirt");
    expect(createArgs.line_items[0].price_data.currency).toBe("myr");

    // Second item
    expect(createArgs.line_items[1].price_data.unit_amount).toBe(5900);
    expect(createArgs.line_items[1].quantity).toBe(1);
    expect(createArgs.line_items[1].price_data.product_data.name).toBe("Silk Tie");
    expect(createArgs.line_items[1].price_data.currency).toBe("myr");
  });
});
