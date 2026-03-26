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
    req: {
      protocol: "https",
      headers: { origin: "https://fakebyfreetown.com" },
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
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

describe("admin CSV export - products", () => {
  it("returns valid CSV content with headers and rows", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.export.products();

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.count).toBe("number");
    expect(typeof result.filename).toBe("string");
    expect(result.filename).toMatch(/^products-export-\d{4}-\d{2}-\d{2}\.csv$/);

    // Verify CSV structure
    const lines = result.csv.split("\n");
    expect(lines.length).toBeGreaterThan(0);

    // Check header row
    const headerLine = lines[0];
    expect(headerLine).toContain('"ID"');
    expect(headerLine).toContain('"Name"');
    expect(headerLine).toContain('"Price (RM)"');
    expect(headerLine).toContain('"Category"');
    expect(headerLine).toContain('"Stock Quantity"');
    expect(headerLine).toContain('"Featured"');
    expect(headerLine).toContain('"Active"');

    // If products exist, verify data rows
    if (result.count > 0) {
      expect(lines.length).toBe(result.count + 1); // header + data rows
      // Each data row should have the same number of columns as header
      const headerColumns = headerLine.split('","').length;
      const firstDataRow = lines[1];
      const dataColumns = firstDataRow.split('","').length;
      expect(dataColumns).toBe(headerColumns);
    }
  });

  it("denies non-admin access to product export", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.export.products()).rejects.toThrow();
  });
});

describe("admin CSV export - orders", () => {
  it("returns valid CSV content with headers", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.export.orders();

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.count).toBe("number");
    expect(typeof result.filename).toBe("string");
    expect(result.filename).toMatch(/^orders-export-\d{4}-\d{2}-\d{2}\.csv$/);

    // Verify CSV structure
    const lines = result.csv.split("\n");
    expect(lines.length).toBeGreaterThan(0);

    // Check header row
    const headerLine = lines[0];
    expect(headerLine).toContain('"Order ID"');
    expect(headerLine).toContain('"Order Number"');
    expect(headerLine).toContain('"Status"');
    expect(headerLine).toContain('"Total (RM)"');
    expect(headerLine).toContain('"Customer Email"');
    expect(headerLine).toContain('"Items Summary"');
  });

  it("supports status filter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.export.orders({ status: "pending" });

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.count).toBe("number");
  });

  it("supports payment status filter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.export.orders({ paymentStatus: "paid" });

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.count).toBe("number");
  });

  it("denies non-admin access to order export", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.export.orders()).rejects.toThrow();
  });
});
