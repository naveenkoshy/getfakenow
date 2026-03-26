import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    authProvider: "email",
    role: "user",
    emailVerified: false,
    profileCompleted: false,
    onboardingStep: 0,
    phone: null,
    passwordHash: null,
    googleId: null,
    facebookId: null,
    avatarUrl: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: "Malaysia",
    addressVerified: false,
    marketingConsent: false,
    consentDate: null,
    emailOptIn: false,
    smsOptIn: false,
    whatsappOptIn: false,
    messengerOptIn: false,
    messengerPsid: null,
    customerGroup: "new",
    lifetimeValue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    firstPurchaseDate: null,
    lastPurchaseDate: null,
    emailVerificationToken: null,
    emailVerificationExpiry: null,
    resetToken: null,
    resetTokenExpiry: null,
    referralSource: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as AuthenticatedUser;
}

function createContext(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ── Email Verification ──

describe("auth.sendVerificationEmail", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.auth.sendVerificationEmail()).rejects.toThrow("Please login");
  });

  it("returns already-verified message for verified users", async () => {
    const user = createMockUser({ emailVerified: true });
    const caller = appRouter.createCaller(createContext(user));
    const result = await caller.auth.sendVerificationEmail();
    expect(result.message).toContain("already verified");
  });
});

describe("auth.verifyEmail", () => {
  it("rejects invalid token", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.auth.verifyEmail({ token: "invalid-token-12345" })
    ).rejects.toThrow();
  });
});

// ── Return Request ──

describe("orders.requestReturn", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.orders.requestReturn({ orderId: 1, reason: "Wrong size, too small" })
    ).rejects.toThrow("Please login");
  });

  it("rejects non-existent order", async () => {
    const user = createMockUser();
    const caller = appRouter.createCaller(createContext(user));
    await expect(
      caller.orders.requestReturn({ orderId: 999999, reason: "Wrong size, too small" })
    ).rejects.toThrow();
  });

  it("validates reason minimum length via zod", async () => {
    const user = createMockUser();
    const caller = appRouter.createCaller(createContext(user));
    await expect(
      caller.orders.requestReturn({ orderId: 1, reason: "short" })
    ).rejects.toThrow();
  });
});

// ── Admin Anonymize ──

describe("admin.customers.anonymize", () => {
  it("rejects non-admin users", async () => {
    const user = createMockUser({ role: "user" });
    const caller = appRouter.createCaller(createContext(user));
    await expect(
      caller.admin.customers.anonymize({ id: 2 })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.admin.customers.anonymize({ id: 2 })
    ).rejects.toThrow("Please login");
  });

  it("rejects anonymizing non-existent user", async () => {
    const admin = createMockUser({ id: 1, role: "admin" });
    const caller = appRouter.createCaller(createContext(admin));
    await expect(
      caller.admin.customers.anonymize({ id: 999999 })
    ).rejects.toThrow();
  });
});

// ── Admin Order Status Update (return statuses) ──

describe("admin.orders.updateStatus", () => {
  it("rejects non-admin users", async () => {
    const user = createMockUser({ role: "user" });
    const caller = appRouter.createCaller(createContext(user));
    await expect(
      caller.admin.orders.updateStatus({ id: 1, status: "returned" })
    ).rejects.toThrow();
  });
});
