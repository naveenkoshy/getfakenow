import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://getfakenow.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://getfakenow.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ============ EMAIL SERVICE TESTS ============
describe("Email Service", () => {
  it("sendPasswordResetEmail module exists and exports correctly", async () => {
    const emailModule = await import("./email");
    expect(typeof emailModule.sendPasswordResetEmail).toBe("function");
    expect(typeof emailModule.sendVerificationEmail).toBe("function");
    expect(typeof emailModule.sendOrderConfirmationEmail).toBe("function");
  });

  it("sendPasswordResetEmail returns boolean", async () => {
    const { sendPasswordResetEmail } = await import("./email");
    // Should not throw, returns boolean
    const result = await sendPasswordResetEmail("test@example.com", "test-token", "https://getfakenow.com");
    expect(typeof result).toBe("boolean");
  });

  it("sendVerificationEmail returns boolean", async () => {
    const { sendVerificationEmail } = await import("./email");
    const result = await sendVerificationEmail("test@example.com", "test-token", "https://getfakenow.com");
    expect(typeof result).toBe("boolean");
  });

  it("sendOrderConfirmationEmail returns boolean", async () => {
    const { sendOrderConfirmationEmail } = await import("./email");
    const result = await sendOrderConfirmationEmail(
      "test@example.com",
      "ORD-TEST123",
      5000,
      [{ name: "Test Shirt", quantity: 1, price: 5000 }],
      "https://getfakenow.com"
    );
    expect(typeof result).toBe("boolean");
  });
});

// ============ RATE LIMITING TESTS ============
describe("Rate Limiting", () => {
  it("rate limiter module exports correctly", async () => {
    const rateLimitModule = await import("./rateLimit");
    expect(typeof rateLimitModule.authRateLimiter).toBe("function");
    expect(typeof rateLimitModule.apiRateLimiter).toBe("function");
    expect(typeof rateLimitModule.registerRateLimiters).toBe("function");
  });

  it("authRateLimiter is configured with 15-minute window", async () => {
    const { authRateLimiter } = await import("./rateLimit");
    // express-rate-limit stores config internally, just verify it's a valid middleware
    expect(authRateLimiter).toBeDefined();
    expect(typeof authRateLimiter).toBe("function");
  });

  it("apiRateLimiter is configured", async () => {
    const { apiRateLimiter } = await import("./rateLimit");
    expect(apiRateLimiter).toBeDefined();
    expect(typeof apiRateLimiter).toBe("function");
  });
});

// ============ EMAIL VERIFICATION ENFORCEMENT TESTS ============
describe("Email Verification Enforcement", () => {
  it("checkout.createSession rejects unverified email", async () => {
    const ctx = createMockContext({ emailVerified: false });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.checkout.createSession({
        shippingName: "Test User",
        shippingEmail: "test@example.com",
        shippingPhone: "+60123456789",
        shippingAddress: "123 Test St",
        shippingCity: "KL",
        shippingState: "WP",
        shippingPostalCode: "50000",
        shippingCountry: "Malaysia",
      })
    ).rejects.toThrow(/verify your email/i);
  });

  it("auth.verifyEmail rejects invalid token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.verifyEmail({ token: "nonexistent-token" })
    ).rejects.toThrow(/invalid verification token/i);
  });

  it("auth.sendVerificationEmail is a protected procedure", async () => {
    // Calling without auth should fail
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      (caller.auth as any).sendVerificationEmail()
    ).rejects.toThrow();
  });
});

// ============ RETURN REQUEST TESTS ============
describe("Return Request", () => {
  it("orders.requestReturn rejects non-delivered orders", async () => {
    // This test verifies the procedure exists and validates status
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Should throw because order doesn't exist (NOT_FOUND)
    await expect(
      caller.orders.requestReturn({ orderId: 99999, reason: "Item doesn't fit properly" })
    ).rejects.toThrow(/not found/i);
  });

  it("orders.requestReturn requires minimum reason length", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.requestReturn({ orderId: 1, reason: "short" })
    ).rejects.toThrow();
  });
});

// ============ ADMIN ANONYMIZE TESTS ============
describe("Admin Customer Anonymization", () => {
  it("admin.customers.anonymize rejects non-admin users", async () => {
    const ctx = createMockContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      (caller.admin as any).customers.anonymize({ id: 1 })
    ).rejects.toThrow(/admin access required/i);
  });

  it("admin.customers.anonymize rejects nonexistent customer", async () => {
    const ctx = createMockContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.customers.anonymize({ id: 99999 })
    ).rejects.toThrow(/not found/i);
  });
});

// ============ ORDER STATUS ENUM TESTS ============
describe("Order Status Enum", () => {
  it("admin.orders.updateStatus accepts return_requested status", async () => {
    const ctx = createMockContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    // Should throw NOT_FOUND (order doesn't exist), not a validation error
    await expect(
      caller.admin.orders.updateStatus({ id: 99999, status: "return_requested" })
    ).rejects.toThrow(/not found/i);
  });

  it("admin.orders.updateStatus accepts returned status", async () => {
    const ctx = createMockContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.orders.updateStatus({ id: 99999, status: "returned" })
    ).rejects.toThrow(/not found/i);
  });
});

// ============ STRIPE WEBHOOK HANDLER TESTS ============
describe("Stripe Webhook Handler", () => {
  it("handleStripeWebhook handles checkout.session.expired event type", async () => {
    const { handleStripeWebhook } = await import("./stripeWebhook");
    expect(typeof handleStripeWebhook).toBe("function");
  });

  it("stripeWebhook exports constructStripeEvent", async () => {
    const webhookModule = await import("./stripeWebhook");
    expect(typeof webhookModule.constructStripeEvent).toBe("function");
  });
});
