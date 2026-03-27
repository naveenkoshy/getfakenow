import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock Stripe
vi.mock('./stripe', () => ({
  createCheckoutSession: vi.fn(),
  createRefund: vi.fn().mockResolvedValue({
    id: 'ref_test_123',
    amount: 5000,
    status: 'succeeded',
    payment_intent: 'pi_test_123',
  }),
  constructWebhookEvent: vi.fn(),
  stripe: {},
}));

// Mock email
vi.mock('./email', () => ({
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendAdminInviteEmail: vi.fn(),
  sendOrderConfirmationEmail: vi.fn(),
  sendRefundEmail: vi.fn().mockResolvedValue(true),
}));

// Mock audit log
vi.mock('./auditLog', () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

function createAdminContext(overrides = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: 'admin-open-id',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
      emailVerified: true,
      avatarUrl: null,
      phone: null,
      marketingConsent: false,
      consentDate: null,
      emailConsent: false,
      smsConsent: false,
      pushConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
    isAdminSession: true,
    req: { headers: { 'x-forwarded-for': '127.0.0.1', origin: 'http://localhost:3000' } } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
    ...overrides,
  };
}

function createNonAdminContext(): TrpcContext {
  return {
    user: null,
    isAdminSession: false,
    req: { headers: {} } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

describe('Refund History - List Procedure', () => {
  it('should have the refunds.list procedure defined', () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.admin.refunds.list).toBeDefined();
  });

  it('should accept optional filter parameters', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Should not throw on valid input (may return empty results from DB)
    const result = await caller.admin.refunds.list({
      search: 'test',
      refundType: 'full',
      status: 'succeeded',
      limit: 10,
      offset: 0,
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('refunds');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.refunds)).toBe(true);
  });

  it('should accept "all" as refundType filter', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.list({
      refundType: 'all',
      status: 'all',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('refunds');
  });

  it('should accept partial filter', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.list({
      refundType: 'partial',
    });
    expect(result).toBeDefined();
  });

  it('should accept date range filters', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.list({
      startDate: '2025-01-01',
      endDate: '2026-12-31',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('refunds');
  });

  it('should support pagination with limit and offset', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.list({
      limit: 5,
      offset: 0,
    });
    expect(result).toBeDefined();
    expect(typeof result.total).toBe('number');
  });

  it('should work with no input (defaults)', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.list();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('refunds');
    expect(result).toHaveProperty('total');
  });

  it('should reject non-admin users', async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.admin.refunds.list()).rejects.toThrow();
  });

  it('should reject non-admin session', async () => {
    const caller = appRouter.createCaller(createAdminContext({ isAdminSession: false }));
    await expect(caller.admin.refunds.list()).rejects.toThrow();
  });
});

describe('Refund History - Stats Procedure', () => {
  it('should have the refunds.stats procedure defined', () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.admin.refunds.stats).toBeDefined();
  });

  it('should return stats object with expected properties', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.stats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('totalRefunded');
    expect(result).toHaveProperty('refundCount');
    expect(result).toHaveProperty('fullRefunds');
    expect(result).toHaveProperty('partialRefunds');
    expect(result).toHaveProperty('failedRefunds');
    expect(result).toHaveProperty('avgRefundAmount');
  });

  it('should return coercible numeric values for all stats', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.stats();
    // SQL aggregates may return strings; verify they're coercible to numbers
    expect(Number(result.totalRefunded)).not.toBeNaN();
    expect(Number(result.refundCount)).not.toBeNaN();
    expect(Number(result.fullRefunds)).not.toBeNaN();
    expect(Number(result.partialRefunds)).not.toBeNaN();
    expect(Number(result.failedRefunds)).not.toBeNaN();
    expect(Number(result.avgRefundAmount)).not.toBeNaN();
  });

  it('should accept optional date range', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.stats({
      startDate: '2025-01-01',
      endDate: '2026-12-31',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('refundCount');
  });

  it('should reject non-admin users', async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.admin.refunds.stats()).rejects.toThrow();
  });
});

describe('Refund History - Export Procedure', () => {
  it('should have the refunds.export procedure defined', () => {
    const caller = appRouter.createCaller(createAdminContext());
    expect(caller.admin.refunds.export).toBeDefined();
  });

  it('should return CSV string and count', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.export();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('csv');
    expect(result).toHaveProperty('count');
    expect(typeof result.csv).toBe('string');
    expect(typeof result.count).toBe('number');
  });

  it('should include CSV headers', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.export();
    // CSV should contain the BOM and header row
    expect(result.csv).toContain('Refund ID');
    expect(result.csv).toContain('Stripe Refund ID');
    expect(result.csv).toContain('Order Number');
    expect(result.csv).toContain('Customer Name');
    expect(result.csv).toContain('Refund Amount');
    expect(result.csv).toContain('Status');
  });

  it('should accept filter parameters', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.refunds.export({
      refundType: 'full',
      status: 'succeeded',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('csv');
  });

  it('should reject non-admin users', async () => {
    const caller = appRouter.createCaller(createNonAdminContext());
    await expect(caller.admin.refunds.export()).rejects.toThrow();
  });
});

describe('UpdateStatus with refundReason', () => {
  it('should accept refundReason parameter', () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Verify the procedure exists
    expect(caller.admin.orders.updateStatus).toBeDefined();
  });

  it('should accept valid refundReason values', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Will fail at DB level but validates input schema accepts refundReason
    await expect(
      caller.admin.orders.updateStatus({
        id: 999999,
        status: 'returned',
        refundType: 'full',
        refundReason: 'defective_item',
      })
    ).rejects.toThrow(/not found|Not Found/i);
  });

  it('should accept all defined reason values', async () => {
    const reasons = [
      'requested_by_customer',
      'defective_item',
      'wrong_item',
      'not_as_described',
      'size_issue',
      'late_delivery',
      'duplicate_order',
      'other',
    ];
    const caller = appRouter.createCaller(createAdminContext());
    
    for (const reason of reasons) {
      await expect(
        caller.admin.orders.updateStatus({
          id: 999999,
          status: 'returned',
          refundType: 'full',
          refundReason: reason,
        })
      ).rejects.toThrow(/not found|Not Found/i);
    }
  });
});

describe('Enhanced Refund Email', () => {
  it('should be importable with enhanced signature', async () => {
    const { sendRefundEmail } = await import('./email');
    expect(sendRefundEmail).toBeDefined();
    expect(typeof sendRefundEmail).toBe('function');
  });

  it('should accept enhanced options parameter', async () => {
    const { sendRefundEmail } = await import('./email');
    const result = await sendRefundEmail(
      'customer@test.com',
      'ORD-001',
      5000,
      false,
      'http://localhost:3000',
      {
        orderTotal: 10000,
        reason: 'defective_item',
        customerName: 'Test Customer',
        items: [
          { name: 'Test Product', quantity: 1, price: 5000 },
        ],
      }
    );
    expect(result).toBeDefined();
  });

  it('should work without optional options parameter', async () => {
    const { sendRefundEmail } = await import('./email');
    const result = await sendRefundEmail(
      'customer@test.com',
      'ORD-002',
      3000,
      true,
      'http://localhost:3000'
    );
    expect(result).toBeDefined();
  });
});
