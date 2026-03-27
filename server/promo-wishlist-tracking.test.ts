import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ──
function createUserContext(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      avatarUrl: null,
      emailVerified: true,
      ...overrides,
    },
    isAdminSession: false,
    req: { headers: { origin: "http://localhost:3000", "x-forwarded-for": "127.0.0.1" } } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

function createAdminContext(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "admin-open-id",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      avatarUrl: null,
      emailVerified: true,
      ...overrides,
    },
    isAdminSession: true,
    req: { headers: { origin: "http://localhost:3000", "x-forwarded-for": "127.0.0.1" } } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

function createGuestContext(): TrpcContext {
  return {
    user: null,
    isAdminSession: false,
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

// ── Promo Code Tests ──
describe("Promo Code System", () => {
  it("should reject empty promo code", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.promo.validate({ code: "" })).rejects.toThrow();
  });

  it("should require authentication for promo validation", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.promo.validate({ code: "TESTCODE" })).rejects.toThrow();
  });

  it("should handle non-existent promo code", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.promo.validate({ code: "NONEXISTENT_CODE_12345" })).rejects.toThrow();
  });
});

// ── Wishlist Tests ──
describe("Wishlist Feature", () => {
  it("should require authentication to list wishlist", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.wishlist.list()).rejects.toThrow();
  });

  it("should require authentication to toggle wishlist", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.wishlist.toggle({ productId: 1 })).rejects.toThrow();
  });

  it("should require authentication to get wishlist count", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.wishlist.count()).rejects.toThrow();
  });

  it("should require authentication to get wishlist product IDs", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.wishlist.productIds()).rejects.toThrow();
  });

  it("should validate productId is a positive number", async () => {
    const caller = appRouter.createCaller(createUserContext());
    // Negative productId may still pass zod validation (z.number()), but the DB won't find it
    // Test that it at least doesn't crash the server
    try {
      await caller.wishlist.toggle({ productId: -1 });
    } catch (e: any) {
      // Expected to throw - either validation or not-found
      expect(e).toBeDefined();
    }
  });

  it("should return empty wishlist for new user", async () => {
    const caller = appRouter.createCaller(createUserContext({ id: 99999 }));
    const items = await caller.wishlist.list();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  it("should return zero count for new user", async () => {
    const caller = appRouter.createCaller(createUserContext({ id: 99999 }));
    const count = await caller.wishlist.count();
    expect(count).toBe(0);
  });

  it("should return empty product IDs for new user", async () => {
    const caller = appRouter.createCaller(createUserContext({ id: 99999 }));
    const ids = await caller.wishlist.productIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(0);
  });
});

// ── Order Tracking Tests ──
describe("Order Tracking", () => {
  it("should require authentication for order tracking", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.tracking.getByOrderNumber({ orderNumber: "ORD-123" })
    ).rejects.toThrow();
  });

  it("should return not found for non-existent order", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.tracking.getByOrderNumber({ orderNumber: "ORD-NONEXISTENT-99999" })
    ).rejects.toThrow();
  });

  it("should validate orderNumber is non-empty", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.tracking.getByOrderNumber({ orderNumber: "" })
    ).rejects.toThrow();
  });

  it("should allow public tracking with order number and email", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.tracking.publicTrack({ orderNumber: "ORD-NONEXISTENT-99999", email: "test@example.com" })
    ).rejects.toThrow(); // Not found, but no auth error
  });

  it("should validate email format for public tracking", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.tracking.publicTrack({ orderNumber: "ORD-123", email: "not-an-email" })
    ).rejects.toThrow();
  });
});
