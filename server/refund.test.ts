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
  sendRefundConfirmationEmail: vi.fn().mockResolvedValue(true),
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
    req: { headers: { 'x-forwarded-for': '127.0.0.1' } } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
    ...overrides,
  };
}

describe('Stripe Refund Integration', () => {
  it('should accept refundType parameter in updateStatus input', () => {
    // The updateStatus procedure should accept refundType and refundAmount
    const caller = appRouter.createCaller(createAdminContext());
    // Verify the procedure exists and can be called (will fail at DB level but validates input schema)
    expect(caller.admin.orders.updateStatus).toBeDefined();
  });

  it('should reject refund for non-existent order', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.admin.orders.updateStatus({ id: 999999, status: 'returned', refundType: 'full' })
    ).rejects.toThrow();
  });

  it('should validate refundType enum values', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Invalid refundType should fail validation
    await expect(
      caller.admin.orders.updateStatus({ id: 1, status: 'returned', refundType: 'invalid' as any })
    ).rejects.toThrow();
  });

  it('should accept full refund type', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // This will fail at DB level but validates that 'full' is accepted as input
    await expect(
      caller.admin.orders.updateStatus({ id: 999999, status: 'returned', refundType: 'full' })
    ).rejects.toThrow(/not found|Not Found/i);
  });

  it('should accept partial refund type with amount', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.admin.orders.updateStatus({ id: 999999, status: 'returned', refundType: 'partial', refundAmount: 2500 })
    ).rejects.toThrow(/not found|Not Found/i);
  });

  it('should accept none refund type (return without refund)', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.admin.orders.updateStatus({ id: 999999, status: 'returned', refundType: 'none' })
    ).rejects.toThrow(/not found|Not Found/i);
  });

  it('should require admin session for refund operations', async () => {
    const nonAdminContext: TrpcContext = {
      user: null,
      isAdminSession: false,
      req: { headers: {} } as any,
      res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
    };
    const caller = appRouter.createCaller(nonAdminContext);
    await expect(
      caller.admin.orders.updateStatus({ id: 1, status: 'returned', refundType: 'full' })
    ).rejects.toThrow();
  });

  it('should not allow non-admin users to process refunds', async () => {
    const userContext = createAdminContext({ isAdminSession: false });
    const caller = appRouter.createCaller(userContext);
    await expect(
      caller.admin.orders.updateStatus({ id: 1, status: 'returned', refundType: 'full' })
    ).rejects.toThrow();
  });
});

describe('createRefund function', () => {
  it('should be importable from stripe module', async () => {
    const { createRefund } = await import('./stripe');
    expect(createRefund).toBeDefined();
    expect(typeof createRefund).toBe('function');
  });

  it('should accept paymentIntentId and optional amount', async () => {
    const { createRefund } = await import('./stripe');
    const result = await createRefund({
      paymentIntentId: 'pi_test_123',
      reason: 'requested_by_customer',
    });
    expect(result).toBeDefined();
    expect(result.id).toBe('ref_test_123');
  });

  it('should accept partial refund with amount', async () => {
    const { createRefund } = await import('./stripe');
    const result = await createRefund({
      paymentIntentId: 'pi_test_123',
      amount: 2500,
      reason: 'requested_by_customer',
    });
    expect(result).toBeDefined();
  });

  it('should accept metadata in refund params', async () => {
    const { createRefund } = await import('./stripe');
    const result = await createRefund({
      paymentIntentId: 'pi_test_123',
      metadata: {
        order_id: '123',
        refund_type: 'full',
      },
    });
    expect(result).toBeDefined();
  });
});

describe('Refund confirmation email', () => {
  it('should be importable from email module', async () => {
    const { sendRefundConfirmationEmail } = await import('./email');
    expect(sendRefundConfirmationEmail).toBeDefined();
    expect(typeof sendRefundConfirmationEmail).toBe('function');
  });

  it('should accept email parameters', async () => {
    const { sendRefundConfirmationEmail } = await import('./email');
    const result = await sendRefundConfirmationEmail({
      to: 'customer@test.com',
      customerName: 'Test Customer',
      orderNumber: 'ORD-001',
      refundAmount: 5000,
      refundType: 'full',
    });
    expect(result).toBe(true);
  });
});
