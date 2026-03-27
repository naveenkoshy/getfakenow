import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "checkout-user",
    email: "buyer@example.com",
    name: "Test Buyer",
    loginMethod: "email",
    role: "user",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    isAdminSession: false,
    req: {
      protocol: "https",
      headers: { origin: "https://localhost:3000" },
      ip: "127.0.0.1",
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    isAdminSession: false,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
}

const shippingData = {
  shippingName: "Test Buyer",
  shippingEmail: "buyer@example.com",
  shippingPhone: "+60123456789",
  shippingAddress: "123 Test Street",
  shippingCity: "Kuala Lumpur",
  shippingState: "Selangor",
  shippingPostalCode: "50000",
  shippingCountry: "Malaysia",
};

describe("checkout flow", () => {
  describe("checkout.createSession", () => {
    it("requires authentication", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.checkout.createSession(shippingData)
      ).rejects.toThrow();
    });

    it("requires email verification before checkout", async () => {
      const ctx = createUserContext({ emailVerified: false });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.checkout.createSession(shippingData)
      ).rejects.toThrow(/verify your email/i);
    });

    it("validates email format in shipping", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.checkout.createSession({
          ...shippingData,
          shippingEmail: "not-an-email",
        })
      ).rejects.toThrow();
    });
  });

  describe("cart operations", () => {
    it("requires authentication for cart.get", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.cart.get()).rejects.toThrow();
    });

    it("requires authentication for cart.add", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.cart.add({ productId: 1, quantity: 1, size: "M", color: "black" })
      ).rejects.toThrow();
    });
  });

  describe("orders", () => {
    it("requires authentication for orders.list", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.orders.list()).rejects.toThrow();
    });

    it("requires authentication for orders.getById", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.orders.getById({ id: 1 })
      ).rejects.toThrow();
    });
  });

  describe("products (public)", () => {
    it("allows unauthenticated access to products.list", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw - products are public
      const result = await caller.products.list({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("rejects getRelated for non-existent product", async () => {
      const ctx = createAnonContext();
      const caller = appRouter.createCaller(ctx);

      // Should throw NOT_FOUND for non-existent product
      await expect(
        caller.products.getRelated({ productId: 99999, limit: 4 })
      ).rejects.toThrow(/not found/i);
    });
  });
});
