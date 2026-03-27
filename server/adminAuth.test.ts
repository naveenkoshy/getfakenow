import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ADMIN_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { isValidAdminPassword } from "./adminAuth";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(overrides?: Partial<{ isAdminSession: boolean; role: string }>): {
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
    role: overrides?.role ?? "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    isAdminSession: overrides?.isAdminSession ?? true,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
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

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    isAdminSession: false,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
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

// ============ Admin Password Validation ============
describe("isValidAdminPassword", () => {
  it("rejects passwords shorter than 12 characters", () => {
    const result = isValidAdminPassword("Short1!abc");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("12 characters");
  });

  it("rejects passwords without uppercase", () => {
    const result = isValidAdminPassword("alllowercase1!");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("uppercase");
  });

  it("rejects passwords without lowercase", () => {
    const result = isValidAdminPassword("ALLUPPERCASE1!");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("lowercase");
  });

  it("rejects passwords without numbers", () => {
    const result = isValidAdminPassword("NoNumbersHere!");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("number");
  });

  it("rejects passwords without special characters", () => {
    const result = isValidAdminPassword("NoSpecial1234A");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("special character");
  });

  it("accepts valid admin passwords", () => {
    const result = isValidAdminPassword("StrongPass1!ab");
    expect(result.valid).toBe(true);
  });
});

// ============ Admin Auth Router ============
describe("adminAuthRouter.me", () => {
  it("returns null when no admin session exists", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuthRouter.me();
    expect(result).toBeNull();
  });

  it("returns admin user when admin session is valid", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuthRouter.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@example.com");
    expect(result?.role).toBe("admin");
  });

  it("returns null when user has admin role but no admin session cookie", async () => {
    const { ctx } = createAdminContext({ isAdminSession: false });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuthRouter.me();
    expect(result).toBeNull();
  });
});

describe("adminAuthRouter.logout", () => {
  it("clears the admin session cookie", async () => {
    const { ctx, clearedCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminAuthRouter.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
  });
});

// ============ Admin Procedure Guard ============
describe("adminProcedure guard", () => {
  it("rejects non-admin users from admin procedures", async () => {
    const { ctx } = createAdminContext({ role: "user", isAdminSession: true });
    const caller = appRouter.createCaller(ctx);
    // Try to access an admin-only procedure (e.g., admin dashboard stats)
    await expect(caller.admin.dashboard.stats()).rejects.toThrow("Admin access required");
  });

  it("rejects admin-role users without admin session cookie", async () => {
    const { ctx } = createAdminContext({ isAdminSession: false });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.dashboard.stats()).rejects.toThrow("Admin session required");
  });

  it("allows admin users with valid admin session", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw (actual data depends on DB, but the guard should pass)
    try {
      await caller.admin.dashboard.stats();
    } catch (e: any) {
      // If it throws, it should NOT be a FORBIDDEN error — it might be a DB error which is fine
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

// ============ Portability: SITE_URL ============
describe("portability", () => {
  it("VITE_SITE_URL env is set", () => {
    // This validates the env was configured via webdev_request_secrets
    const siteUrl = process.env.VITE_SITE_URL;
    expect(siteUrl).toBeDefined();
    expect(siteUrl).toContain("https://");
  });
});
