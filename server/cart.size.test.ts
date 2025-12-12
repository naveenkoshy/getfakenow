import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("cart.add with size selection", () => {
  it("successfully adds item with size to cart", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get a valid product
    const products = await caller.products.list({});
    if (products.length === 0) {
      throw new Error("No products available for testing");
    }

    const result = await caller.cart.add({
      productId: products[0].id,
      quantity: 1,
      size: "M",
    });

    expect(result).toEqual({ success: true });
  });

  it("requires size parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // @ts-expect-error - Testing missing size parameter
    await expect(caller.cart.add({
      productId: 1,
      quantity: 1,
    })).rejects.toThrow();
  });

  it("validates size enum values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // @ts-expect-error - Testing invalid size value
    await expect(caller.cart.add({
      productId: 1,
      quantity: 1,
      size: "INVALID",
    })).rejects.toThrow();
  });
});
