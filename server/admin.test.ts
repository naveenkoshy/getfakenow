import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    isAdminSession: true,
    req: {
      protocol: "https",
      headers: { origin: "https://fakebyfreetown.com" },
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    isAdminSession: false,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("admin procedures", () => {
  it("should allow admin to list products", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.products.list({ offset: 0, limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result.products)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.total).toBeGreaterThan(0);
  });

  it("should deny non-admin access to product list", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.products.list({ offset: 0, limit: 10 })).rejects.toThrow();
  });

  it("should support product search", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.products.list({ offset: 0, limit: 10, search: "Fake" });
    expect(result).toBeDefined();
    expect(Array.isArray(result.products)).toBe(true);
  });

  it("should allow admin to list orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.orders.list({ offset: 0, limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result.orders)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("should deny non-admin access to order list", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.orders.list({ offset: 0, limit: 10 })).rejects.toThrow();
  });

  it("should throw NOT_FOUND for non-existent order", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.orders.updateStatus({
        id: 999999,
        status: "shipped",
      })
    ).rejects.toThrow();
  });

  it("should deny non-admin from updating order status", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.orders.updateStatus({
        id: 1,
        status: "shipped",
      })
    ).rejects.toThrow();
  });
});

describe("admin dashboard stats", () => {
  it("returns all expected KPI fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.dashboard.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalRevenue).toBe("number");
    expect(typeof stats.orderCount).toBe("number");
    expect(typeof stats.customerCount).toBe("number");
    expect(typeof stats.pendingOrders).toBe("number");
    expect(typeof stats.lowStockCount).toBe("number");
    expect(typeof stats.outOfStockCount).toBe("number");
    expect(typeof stats.ordersToShip).toBe("number");
  });

  it("blocks regular users from dashboard", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.dashboard.stats()).rejects.toThrow();
  });
});

describe("admin categories", () => {
  it("returns all categories", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("admin customers", () => {
  it("returns paginated customer list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.customers.list({ offset: 0, limit: 10 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("blocks regular users from customer list", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.customers.list({ offset: 0, limit: 10 })).rejects.toThrow();
  });
});

describe("admin settings", () => {
  it("can set and retrieve a setting", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.settings.set({ key: "test_setting_vitest", value: "test_value" });
    const settings = await caller.admin.settings.list();
    expect(Array.isArray(settings)).toBe(true);
    const found = settings.find((s: any) => s.key === "test_setting_vitest");
    expect(found).toBeDefined();
    expect(found?.value).toBe("test_value");
  });

  it("blocks regular users from settings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.settings.list()).rejects.toThrow();
  });
});

describe("admin banners", () => {
  it("returns banners list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.banners.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin navigation", () => {
  it("returns navigation items", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.navigation.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin seo", () => {
  it("returns SEO metadata list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.seo.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin shipping", () => {
  it("returns shipping zones", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.shipping.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin activity log", () => {
  it("returns activity log entries", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.activity.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});
