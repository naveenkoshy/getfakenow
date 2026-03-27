import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock email module
vi.mock("./email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
  sendShippingUpdateEmail: vi.fn().mockResolvedValue(true),
  sendRefundEmail: vi.fn().mockResolvedValue(true),
  sendReturnRequestAcknowledgmentEmail: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-cms-test",
    email: "admin-cms@example.com",
    name: "CMS Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
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
}

function createCaller() {
  return appRouter.createCaller(createAdminContext());
}

describe("CMS - Customer Management", () => {
  it("should list customers with pagination", async () => {
    const caller = createCaller();
    const result = await caller.admin.customers.list({ page: 1, limit: 10 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.users)).toBe(true);
  });

  it("should search customers", async () => {
    const caller = createCaller();
    const result = await caller.admin.customers.list({ page: 1, limit: 10, search: "test" });
    expect(result).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
  });

  it("should create a new customer", async () => {
    const caller = createCaller();
    const result = await caller.admin.customers.create({
      name: "CMS Test Customer",
      email: `cms-test-${Date.now()}@example.com`,
      phone: "+60123456789",
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });

  it("should reject duplicate email on customer creation", async () => {
    const caller = createCaller();
    const email = `dup-cms-${Date.now()}@example.com`;
    await caller.admin.customers.create({ name: "First", email });
    await expect(
      caller.admin.customers.create({ name: "Second", email })
    ).rejects.toThrow();
  });

  it("should update customer details", async () => {
    const caller = createCaller();
    const created = await caller.admin.customers.create({
      name: "Update CMS Test",
      email: `update-cms-${Date.now()}@example.com`,
    });
    const result = await caller.admin.customers.update({
      id: created.id,
      name: "Updated CMS Name",
      phone: "+60987654321",
    });
    expect(result).toBeDefined();
  });

  it("should get customer detail by ID", async () => {
    const caller = createCaller();
    const created = await caller.admin.customers.create({
      name: "Detail CMS Test",
      email: `detail-cms-${Date.now()}@example.com`,
    });
    const detail = await caller.admin.customers.getById({ id: created.id });
    expect(detail).toBeDefined();
    expect(detail).toHaveProperty("id");
    expect(detail.name).toBe("Detail CMS Test");
  });
});

describe("CMS - Order Management", () => {
  it("should list orders with pagination", async () => {
    const caller = createCaller();
    const result = await caller.admin.orders.list({ page: 1, limit: 10 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
  });

  it("should filter orders by status", async () => {
    const caller = createCaller();
    const result = await caller.admin.orders.list({ page: 1, limit: 10, status: "pending" });
    expect(result).toBeDefined();
    expect(Array.isArray(result.orders)).toBe(true);
  });

  it("should get order stats", async () => {
    const caller = createCaller();
    const result = await caller.admin.dashboard.stats();
    expect(result).toBeDefined();
  });
});

describe("CMS - Shipping Zones", () => {
  it("should list shipping zones", async () => {
    const caller = createCaller();
    const result = await caller.admin.shipping.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a shipping zone", async () => {
    const caller = createCaller();
    const result = await caller.admin.shipping.create({
      name: `CMS Zone ${Date.now()}`,
      states: "Selangor, KL",
      flatRate: 800,
      freeShippingThreshold: 15000,
      estimatedDays: "2-4 business days",
    });
    expect(result).toBeDefined();
  });
});

describe("CMS - SEO Management", () => {
  it("should list SEO meta entries", async () => {
    const caller = createCaller();
    const result = await caller.admin.seo.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should upsert SEO meta", async () => {
    const caller = createCaller();
    const result = await caller.admin.seo.upsert({
      pageType: "page",
      metaTitle: "CMS Test Page Title",
      metaDescription: "CMS Test description",
      noIndex: false,
    });
    expect(result).toBeDefined();
  });

  it("should list redirects", async () => {
    const caller = createCaller();
    const result = await caller.admin.seo.redirects.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a redirect", async () => {
    const caller = createCaller();
    const result = await caller.admin.seo.redirects.create({
      fromPath: `/old-cms-${Date.now()}`,
      toPath: "/new-page",
      type: "301",
    });
    expect(result).toBeDefined();
  });
});

describe("CMS - Email Templates", () => {
  it("should list email templates", async () => {
    const caller = createCaller();
    const result = await caller.admin.emailTemplates.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an email template", async () => {
    const caller = createCaller();
    const result = await caller.admin.emailTemplates.create({
      key: `cms_test_${Date.now()}`,
      name: "CMS Test Template",
      subject: "Test Subject {{order_number}}",
      htmlBody: "<h1>Hello {{customer_name}}</h1>",
      textBody: "Hello",
      category: "transactional",
    });
    expect(result).toBeDefined();
  });

  it("should update an email template", async () => {
    const caller = createCaller();
    const key = `cms_update_${Date.now()}`;
    await caller.admin.emailTemplates.create({
      key,
      name: "CMS Update Test",
      subject: "Original",
      htmlBody: "<p>Original</p>",
      textBody: "",
      category: "transactional",
    });
    const list = await caller.admin.emailTemplates.list();
    const found = list.find((t: any) => t.key === key);
    expect(found).toBeDefined();
    const result = await caller.admin.emailTemplates.update({
      id: found!.id,
      name: "Updated CMS",
      subject: "Updated",
      htmlBody: "<p>Updated</p>",
      textBody: "Updated",
    });
    expect(result).toBeDefined();
  });

  it("should delete an email template", async () => {
    const caller = createCaller();
    const key = `cms_delete_${Date.now()}`;
    await caller.admin.emailTemplates.create({
      key,
      name: "CMS Delete Test",
      subject: "Subject",
      htmlBody: "<p>Body</p>",
      textBody: "",
      category: "system",
    });
    const list = await caller.admin.emailTemplates.list();
    const found = list.find((t: any) => t.key === key);
    expect(found).toBeDefined();
    const result = await caller.admin.emailTemplates.delete({ id: found!.id });
    expect(result).toBeDefined();
  });
});

describe("CMS - Settings", () => {
  it("should list all settings", async () => {
    const caller = createCaller();
    const result = await caller.admin.settings.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should set a setting value", async () => {
    const caller = createCaller();
    const result = await caller.admin.settings.set({
      key: `cms_setting_${Date.now()}`,
      value: "test_value",
    });
    expect(result).toBeDefined();
  });

  it("should update an existing setting", async () => {
    const caller = createCaller();
    const key = `cms_update_setting_${Date.now()}`;
    await caller.admin.settings.set({ key, value: "original" });
    const result = await caller.admin.settings.set({ key, value: "updated" });
    expect(result).toBeDefined();
  });
});

describe("CMS - Categories", () => {
  it("should list categories", async () => {
    const caller = createCaller();
    const result = await caller.admin.categories.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a category", async () => {
    const caller = createCaller();
    const result = await caller.admin.categories.create({
      name: `CMS Cat ${Date.now()}`,
      slug: `cms-cat-${Date.now()}`,
      description: "CMS test category",
    });
    expect(result).toBeDefined();
  });
});

describe("CMS - Pages & Content", () => {
  it("should list pages", async () => {
    const caller = createCaller();
    const result = await caller.admin.pages.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a page", async () => {
    const caller = createCaller();
    const result = await caller.admin.pages.create({
      key: `cms-page-${Date.now()}`,
      title: `CMS Page ${Date.now()}`,
      body: "<p>CMS test content</p>",
    });
    expect(result).toBeDefined();
  });
});

describe("CMS - Promotions", () => {
  it("should list promotions", async () => {
    const caller = createCaller();
    const result = await caller.admin.promotions.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("CMS - Media Library", () => {
  it("should list media items", async () => {
    const caller = createCaller();
    const result = await caller.admin.media.list();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("media");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.media)).toBe(true);
  });
});

describe("CMS - Return Acknowledgment Email", () => {
  it("should have the return request acknowledgment email function", async () => {
    const { sendReturnRequestAcknowledgmentEmail } = await import("./email");
    expect(typeof sendReturnRequestAcknowledgmentEmail).toBe("function");
  });
});
