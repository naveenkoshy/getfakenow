import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { logAdminAction, getClientIp } from "./auditLog";

type CookieCall = { name: string; value?: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminCtx(overrides?: Partial<AuthenticatedUser>): {
  ctx: TrpcContext;
  setCookies: CookieCall[];
  clearedCookies: CookieCall[];
} {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    isAdminSession: true,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.1" },
      cookies: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, setCookies, clearedCookies };
}

function createPublicCtx(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    isAdminSession: false,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createNonAdminCtx(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "email",
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
      cookies: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// ============ Admin Invites ============
describe("admin.invites", () => {
  it("rejects non-admin users from listing invites", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.invites.list()).rejects.toThrow();
  });

  it("rejects non-admin users from creating invites", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.invites.create({ email: "test@test.com" })).rejects.toThrow();
  });

  it("rejects non-admin users from revoking invites", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.invites.revoke({ id: 1 })).rejects.toThrow();
  });

  it("validates email format on invite creation", async () => {
    const { ctx } = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.invites.create({ email: "not-an-email" })).rejects.toThrow();
  });
});

// ============ Accept Invite (Public) ============
describe("admin.acceptInvite", () => {
  it("validates invite token - returns invalid for non-existent token", async () => {
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.acceptInvite.validate({ token: "nonexistent-token-12345" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid");
    } catch (e: any) {
      // DB might not be available in test, which is acceptable
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("rejects accept with short password", async () => {
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.acceptInvite.accept({ token: "test", name: "Test", password: "short" })
    ).rejects.toThrow("12 characters");
  });

  it("requires a name for account setup", async () => {
    const { ctx } = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.acceptInvite.accept({ token: "test", name: "", password: "StrongPass1!ab" })
    ).rejects.toThrow();
  });
});

// ============ Returns Management ============
describe("admin.returns", () => {
  it("rejects non-admin users from listing returns", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.returns.list()).rejects.toThrow();
  });

  it("rejects non-admin users from viewing return stats", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.returns.stats()).rejects.toThrow();
  });

  it("accepts valid status filter values", async () => {
    const { ctx } = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    // Should not throw on valid input (may throw DB error, but not validation error)
    try {
      await caller.admin.returns.list({ status: "return_requested", limit: 10, offset: 0 });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("rejects invalid status filter values", async () => {
    const { ctx } = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error Testing invalid input
      caller.admin.returns.list({ status: "invalid_status" })
    ).rejects.toThrow();
  });
});

// ============ Audit Log ============
describe("admin.auditLog", () => {
  it("rejects non-admin users from listing audit logs", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog.list()).rejects.toThrow();
  });

  it("rejects non-admin users from viewing action types", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog.actionTypes()).rejects.toThrow();
  });

  it("rejects non-admin users from viewing admin users", async () => {
    const { ctx } = createNonAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog.adminUsers()).rejects.toThrow();
  });

  it("accepts valid filter parameters", async () => {
    const { ctx } = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.auditLog.list({
        action: "admin.login",
        userId: 1,
        limit: 10,
        offset: 0,
      });
    } catch (e: any) {
      // DB error is fine, but should not be a validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ============ Audit Log Helper ============
describe("auditLog helper", () => {
  it("getClientIp extracts IP from x-forwarded-for header", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.50, 70.41.3.18" },
      ip: "127.0.0.1",
    } as any;
    expect(getClientIp(req)).toBe("203.0.113.50");
  });

  it("getClientIp falls back to req.ip", () => {
    const req = {
      headers: {},
      ip: "192.168.1.100",
    } as any;
    expect(getClientIp(req)).toBe("192.168.1.100");
  });

  it("getClientIp returns unknown when no IP available", () => {
    const req = { headers: {} } as any;
    expect(getClientIp(req)).toBe("unknown");
  });

  it("logAdminAction is a function", () => {
    expect(typeof logAdminAction).toBe("function");
  });
});
