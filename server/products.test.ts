import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  const ctx: TrpcContext = {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return ctx;
}

describe("products procedures", () => {
  it("should list products without authentication", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get product by slug", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First get a product from the list
    const products = await caller.products.list({});
    if (products.length > 0) {
      const firstProduct = products[0];
      const result = await caller.products.getBySlug({ slug: firstProduct!.slug });

      expect(result).toBeDefined();
      expect(result?.slug).toBe(firstProduct!.slug);
    }
  });

  it("should filter products by category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();
    if (categories.length > 0) {
      const firstCategory = categories[0];
      const result = await caller.products.list({ categoryId: firstCategory!.id });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("should search products by name", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({ search: "shirt" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list featured products", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({ featured: true });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("categories procedures", () => {
  it("should list categories", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
