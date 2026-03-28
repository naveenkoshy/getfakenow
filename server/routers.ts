import { COOKIE_NAME, ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { storagePut } from "./storage";
import { createCheckoutSession } from "./stripe";
import * as auth from "./auth";
import * as adminAuth from "./adminAuth";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { sendPasswordResetEmail, sendVerificationEmail, sendOrderConfirmationEmail, sendReturnRequestAcknowledgmentEmail } from "./email";

// Admin-only procedure — requires separate admin session cookie
// Also refreshes the sliding-window timeout on every authenticated request
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  // Require the dedicated admin session (not just a customer session with admin role)
  if (!ctx.isAdminSession) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin session required. Please log in at /admin/login' });
  }
  // Sliding window: refresh admin session on each authenticated request
  adminAuth.refreshAdminSession(ctx.req, ctx.res, ctx.user.id, ctx.user.email);
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  // ============ AUTH ============
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!auth.isValidEmail(input.email)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid email format' });
        }
        if (!auth.isValidPassword(input.password)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
        }
        const existingUser = await auth.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
        }
        await auth.createUser({ email: input.email, password: input.password, name: input.name });
        const user = await auth.getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        
        const token = jwt.sign({ userId: user.id, email: user.email }, ENV.jwtSecret, { expiresIn: '30d' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
        
        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await auth.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        }
        const isValid = await auth.verifyPassword(input.password, user.passwordHash);
        if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        
        await auth.updateLastSignIn(user.id);
        const expiresIn = input.rememberMe ? '30d' : '7d';
        const token = jwt.sign({ userId: user.id, email: user.email }, ENV.jwtSecret, { expiresIn });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const maxAge = input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge });
        
        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }),
    
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const user = await auth.getUserByEmail(input.email);
        if (!user) return { success: true, message: 'If email exists, reset link sent' };
        const token = auth.generateResetToken();
        await auth.setResetToken(input.email, token);
        const origin = ctx.req.headers.origin || ENV.siteUrl;
        await sendPasswordResetEmail(input.email, token, origin);
        return { success: true, message: 'If email exists, reset link sent' };
      }),
    
    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        if (!auth.isValidPassword(input.newPassword)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
        }
        try {
          await auth.resetPassword(input.token, input.newPassword);
          return { success: true, message: 'Password reset successfully' };
        } catch (error) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired reset token' });
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Send email verification
    sendVerificationEmail: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.emailVerified) {
          return { success: true, message: 'Email already verified' };
        }
        const token = auth.generateResetToken(); // reuse secure token generator
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24); // 24 hour validity
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbConn.update(users).set({
          emailVerificationToken: token,
          emailVerificationExpiry: expiry,
        }).where(eq(users.id, ctx.user.id));
        const origin = ctx.req.headers.origin || ENV.siteUrl;
        await sendVerificationEmail(ctx.user.email || '', token, origin);
        return { success: true, message: 'Verification email sent' };
      }),

    // Verify email with token
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const [user] = await dbConn.select().from(users)
          .where(eq(users.emailVerificationToken, input.token)).limit(1);
        if (!user) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid verification token' });
        if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Verification token has expired. Please request a new one.' });
        }
        await dbConn.update(users).set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        }).where(eq(users.id, user.id));
        return { success: true, message: 'Email verified successfully' };
      }),

    // Customer profile update (onboarding + profile page)
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        addressStreet: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
        addressZip: z.string().optional(),
        addressCountry: z.string().optional(),
        marketingConsent: z.boolean().optional(),
        marketingChannels: z.string().optional(), // JSON string: ["email","whatsapp","sms"]
        profileCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.addressStreet !== undefined) updateData.addressStreet = input.addressStreet;
        if (input.addressCity !== undefined) updateData.addressCity = input.addressCity;
        if (input.addressState !== undefined) updateData.addressState = input.addressState;
        if (input.addressZip !== undefined) updateData.addressZip = input.addressZip;
        if (input.addressCountry !== undefined) updateData.addressCountry = input.addressCountry;
        if (input.marketingConsent !== undefined) {
          updateData.marketingConsent = input.marketingConsent;
          updateData.consentDate = new Date();
        }
        if (input.marketingChannels !== undefined) updateData.marketingChannels = input.marketingChannels;
        if (input.profileCompleted !== undefined) updateData.profileCompleted = input.profileCompleted;

        await dbConn.update(users).set(updateData).where(eq(users.id, ctx.user.id));
        
        const updated = await db.getUserById(ctx.user.id);
        return updated;
      }),

    // Get available auth providers
    providers: publicProcedure.query(() => ({
      manus: true,
      google: !!ENV.googleClientId,
      facebook: !!ENV.facebookAppId,
      email: true,
    })),
  }),

  // ============ ADMIN AUTH (Separate from customer auth) ============
  adminAuthRouter: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await adminAuth.authenticateAdmin(input.email, input.password, ctx.req, ctx.res);
        const { logAdminAction, getClientIp } = await import('./auditLog');
        if (!result.success) {
          // Log failed login attempt
          await logAdminAction({
            userId: 0,
            action: 'admin.login.failed',
            entityType: 'session',
            details: JSON.stringify({ email: input.email, reason: result.error }),
            ipAddress: getClientIp(ctx.req),
          });
          throw new TRPCError({ code: 'UNAUTHORIZED', message: result.error || 'Invalid credentials' });
        }
        // Log successful login
        await logAdminAction({
          userId: result.user!.id,
          action: 'admin.login.success',
          entityType: 'session',
          details: JSON.stringify({ email: input.email }),
          ipAddress: getClientIp(ctx.req),
        });
        return { success: true, user: result.user };
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user && ctx.isAdminSession) {
        const { logAdminAction, getClientIp } = await import('./auditLog');
        await logAdminAction({
          userId: ctx.user.id,
          action: 'admin.logout',
          entityType: 'session',
          ipAddress: getClientIp(ctx.req),
        });
      }
      adminAuth.clearAdminSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.isAdminSession || !ctx.user || ctx.user.role !== 'admin') {
        return null;
      }
      // Refresh session on activity
      adminAuth.refreshAdminSession(ctx.req, ctx.res, ctx.user.id, ctx.user.email);
      return {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        role: ctx.user.role,
      };
    }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const user = await auth.getUserByEmail(input.email);
        // Always return success to prevent email enumeration
        if (!user || user.role !== 'admin') {
          return { success: true, message: 'If an admin account exists with that email, a reset link has been sent.' };
        }
        const token = auth.generateResetToken();
        await auth.setResetToken(input.email, token);
        const origin = ctx.req.headers.origin || ENV.siteUrl;
        await sendPasswordResetEmail(input.email, token, origin);
        return { success: true, message: 'If an admin account exists with that email, a reset link has been sent.' };
      }),

    changePassword: adminProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(12, 'Admin password must be at least 12 characters'),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await auth.getUserByEmail(ctx.user.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No password set for this account' });
        }
        const isValid = await auth.verifyPassword(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
        }
        const validation = adminAuth.isValidAdminPassword(input.newPassword);
        if (!validation.valid) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: validation.message });
        }
        const newHash = await auth.hashPassword(input.newPassword);
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbConn.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));
        return { success: true, message: 'Password updated successfully' };
      }),
  }),

  // ============ CATEGORIES (Public) ============
  categories: router({
    list: publicProcedure.query(async () => db.getAllCategories()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        return category;
      }),
  }),

  // ============ PRODUCTS (Public) ============
  products: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => db.getAllProducts(input)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        const category = await db.getCategoryById(product.categoryId);
        const images = await db.getProductImages(input.id);
        return { ...product, category, images };
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductBySlug(input.slug);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        const category = await db.getCategoryById(product.categoryId);
        const images = await db.getProductImages(product.id);
        return { ...product, category, images };
      }),
    
    getRelated: publicProcedure
      .input(z.object({ productId: z.number(), limit: z.number().optional().default(4) }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        const relatedProducts = await db.getAllProducts({ categoryId: product.categoryId });
        return relatedProducts.filter(p => p.id !== input.productId).slice(0, input.limit);
      }),
  }),

  // ============ CART ============
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
      return { items, total, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
    }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        size: z.string().min(1).max(10),
        color: z.string().min(1).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        if (product.stockQuantity < input.quantity) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient stock' });
        await db.addToCart({ userId: ctx.user.id, productId: input.productId, quantity: input.quantity, size: input.size, color: input.color });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        const items = await db.getCartItems(ctx.user.id);
        const item = items.find(i => i.productId === input.productId);
        if (item) await db.updateCartItemQuantity(item.id, input.quantity);
        return { success: true };
      }),
    
    updateQuantity: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCartItemQuantity(input.id, input.quantity);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromCart(input.id, ctx.user.id);
        return { success: true };
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============ CHECKOUT ============
  checkout: router({
    createSession: protectedProcedure
      .input(z.object({
        shippingName: z.string(),
        shippingEmail: z.string().email(),
        shippingPhone: z.string(),
        shippingAddress: z.string(),
        shippingCity: z.string(),
        shippingState: z.string(),
        shippingPostalCode: z.string(),
        shippingCountry: z.string().default("Malaysia"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Enforce email verification before checkout
        if (!ctx.user.emailVerified) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Please verify your email address before checking out. Check your inbox for a verification link.' });
        }

        const cartItems = await db.getCartItems(ctx.user.id);
        if (cartItems.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });

        // Shipping: RM 8 flat rate, free over RM 75 (7500 sen)
        const FREE_SHIPPING_THRESHOLD = 7500; // 75 MYR in sen
        const FLAT_SHIPPING_FEE = 800; // 8 MYR in sen

        // Use a database transaction with row-level locking to prevent overselling
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        const { products: productsTable } = await import("../drizzle/schema");
        const { eq: eqOp, sql: sqlOp } = await import("drizzle-orm");

        const result = await database.transaction(async (tx) => {
          // Lock and verify stock for each product in the cart
          for (const item of cartItems) {
            if (!item.product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found in cart' });

            // SELECT ... FOR UPDATE locks the row until transaction completes
            const [lockedProduct] = await tx.execute(
              sqlOp`SELECT id, stockQuantity FROM products WHERE id = ${item.productId} FOR UPDATE`
            ) as any;

            const stock = Array.isArray(lockedProduct) ? lockedProduct[0]?.stockQuantity : lockedProduct?.stockQuantity;
            if (stock === undefined || stock < item.quantity) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: `Insufficient stock for ${item.product.name}. Only ${stock ?? 0} left.` });
            }

            // Reserve stock immediately by decrementing
            await tx.execute(
              sqlOp`UPDATE products SET stockQuantity = stockQuantity - ${item.quantity} WHERE id = ${item.productId}`
            );
          }

          // Calculate totals
          const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
          const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
          const totalAmount = subtotal + shippingCost;
          const orderNumber = `ORD-${nanoid(10).toUpperCase()}`;

          // Create order within the same transaction
          await tx.insert((await import("../drizzle/schema")).orders).values({
            userId: ctx.user.id, orderNumber, totalAmount, shippingCost,
            shippingName: input.shippingName, shippingEmail: input.shippingEmail,
            shippingPhone: input.shippingPhone, shippingAddress: input.shippingAddress,
            shippingCity: input.shippingCity, shippingState: input.shippingState,
            shippingPostalCode: input.shippingPostalCode, shippingCountry: input.shippingCountry,
            status: 'pending', paymentStatus: 'pending',
          });

          const [orderRow] = await tx.select().from((await import("../drizzle/schema")).orders)
            .where(eqOp((await import("../drizzle/schema")).orders.orderNumber, orderNumber)).limit(1);
          if (!orderRow) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });

          for (const item of cartItems) {
            if (!item.product) continue;
            await tx.insert((await import("../drizzle/schema")).orderItems).values({
              orderId: orderRow.id, productId: item.productId,
              productName: item.product.name, productPrice: item.product.price,
              quantity: item.quantity, size: item.size, color: item.color,
              subtotal: item.product.price * item.quantity,
            });
          }

          return { orderNumber, totalAmount, shippingCost, orderId: orderRow.id };
        });

        // Create Stripe session outside the DB transaction
        const origin = ctx.req.headers.origin || ENV.siteUrl;
        const stripeItems = cartItems.map(item => ({
          name: item.product!.name, description: item.product!.description || undefined,
          price: item.product!.price, quantity: item.quantity,
          images: item.product!.imageUrl ? [item.product!.imageUrl] : undefined,
        }));

        // Add shipping as a line item if applicable
        if (result.shippingCost > 0) {
          stripeItems.push({
            name: 'Shipping (Standard)', description: 'Flat rate shipping within Malaysia',
            price: result.shippingCost, quantity: 1, images: undefined,
          });
        }

        const session = await createCheckoutSession({
          userId: ctx.user.id, userEmail: ctx.user.email || '', userName: ctx.user.name || '',
          items: stripeItems,
          origin, orderId: result.orderId, orderNumber: result.orderNumber,
        });

        return { sessionId: session.id, url: session.url, orderNumber: result.orderNumber };
      }),
  }),

  // ============ ORDERS (Customer) ============
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getUserOrders(ctx.user.id)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),
    
    getByNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),

    // Customer-initiated return request
    requestReturn: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        reason: z.string().min(10, 'Please provide a reason (at least 10 characters)'),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        if (order.status !== 'delivered') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Returns can only be requested for delivered orders' });
        }
        // Check 14-day return window
        const deliveredDaysAgo = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (deliveredDaysAgo > 14) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Return window has expired (14 days from delivery)' });
        }
        await db.updateOrderStatus(input.orderId, 'return_requested');
        await db.addOrderStatusHistory({
          orderId: input.orderId,
          previousStatus: 'delivered',
          newStatus: 'return_requested',
          changedBy: ctx.user.id,
          note: `Customer return request: ${input.reason}`,
        });

        // Send acknowledgment email to customer
        const orderItems = await db.getOrderItems(input.orderId);
        const origin = ctx.req.headers.origin || ENV.siteUrl || 'http://localhost:3000';
        sendReturnRequestAcknowledgmentEmail(
          ctx.user.email,
          order.orderNumber || `ORD-${order.id}`,
          input.reason,
          origin,
          {
            customerName: ctx.user.name || undefined,
            items: orderItems.map(i => ({ name: i.productName || 'Item', quantity: i.quantity, price: i.productPrice })),
            orderTotal: order.totalAmount,
          }
        ).catch(err => console.warn('[Email] Failed to send return acknowledgment:', err));

        return { success: true, message: 'Return request submitted. We will review it shortly.' };
      }),
  }),

  // ============ WISHLIST (Customer) ============
  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getWishlistByUser(ctx.user.id)),
    
    productIds: protectedProcedure.query(async ({ ctx }) => db.getWishlistProductIds(ctx.user.id)),
    
    count: protectedProcedure.query(async ({ ctx }) => db.getWishlistCount(ctx.user.id)),
    
    toggle: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ids = await db.getWishlistProductIds(ctx.user.id);
        const isInList = ids.includes(input.productId);
        if (isInList) {
          await db.removeFromWishlist(ctx.user.id, input.productId);
          return { added: false, message: "Removed from your stash. We won't judge... much." };
        } else {
          await db.addToWishlist(ctx.user.id, input.productId);
          return { added: true, message: "Added to your stash! Good taste is never fake." };
        }
      }),
  }),

  // ============ PROMO CODE (Customer) ============
  promo: router({
    validate: protectedProcedure
      .input(z.object({ code: z.string().min(1), orderTotal: z.number() }))
      .query(async ({ ctx, input }) => {
        const promo = await db.getPromotionByCode(input.code.toUpperCase().trim());
        if (!promo) return { valid: false, message: "Nice try, legend. That code doesn't exist. \uD83D\uDE0F" };
        if (!promo.active) return { valid: false, message: "This code has retired. It lived a good life." };
        
        const now = new Date();
        if (now < promo.startDate) return { valid: false, message: "Patience, grasshopper. This code isn't active yet." };
        if (now > promo.endDate) return { valid: false, message: "Expired! Like milk, but less smelly. \uD83E\uDD27" };
        if (promo.maxUsage && promo.usageCount >= promo.maxUsage) return { valid: false, message: "Everyone wanted this one. All used up!" };
        
        if (promo.perCustomerLimit) {
          const userUsage = await db.getPromoUsageByUser(promo.id, ctx.user.id);
          if (userUsage >= promo.perCustomerLimit) {
            return { valid: false, message: "You've already used this one. Sharing is caring! \uD83D\uDE09" };
          }
        }
        
        if (promo.minOrderAmount && input.orderTotal < promo.minOrderAmount) {
          return { valid: false, message: `Almost! Spend RM ${((promo.minOrderAmount - input.orderTotal) / 100).toFixed(2)} more to unlock this deal. You got this! \uD83D\uDCAA` };
        }
        
        let discount = 0;
        let description = '';
        if (promo.type === 'percentage') {
          discount = Math.round(input.orderTotal * promo.value / 100);
          description = `${promo.value}% OFF`;
        } else if (promo.type === 'fixed') {
          discount = promo.value;
          description = `RM ${(promo.value / 100).toFixed(2)} OFF`;
        } else if (promo.type === 'free_shipping') {
          discount = 0;
          description = 'FREE SHIPPING';
        }
        
        return { 
          valid: true, 
          discount, 
          type: promo.type, 
          value: promo.value, 
          code: promo.code,
          description,
          promotionId: promo.id,
          message: `YOU LEGEND! ${description} applied. You just saved RM ${(discount / 100).toFixed(2)}! \uD83C\uDF89`,
        };
      }),
  }),

  // ============ ORDER TRACKING (Customer + Public) ============
  tracking: router({
    getByOrderNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const items = await db.getOrderItems(order.id);
        const history = await db.getOrderStatusHistory(order.id);
        return { ...order, items, statusHistory: history };
      }),
    
    publicTrack: publicProcedure
      .input(z.object({ orderNumber: z.string(), email: z.string().email() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: "Hmm, we can't find that order. Double-check the number?" });
        const user = await db.getUserById(order.userId);
        if (!user || user.email.toLowerCase() !== input.email.toLowerCase()) {
          throw new TRPCError({ code: 'NOT_FOUND', message: "Order number and email don't match. Try again?" });
        }
        const items = await db.getOrderItems(order.id);
        const history = await db.getOrderStatusHistory(order.id);
        return {
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          shippingAddress: order.shippingAddress,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: items.map(i => ({ productName: i.productName, quantity: i.quantity, size: i.size, color: i.color })),
          statusHistory: history,
        };
      }),
  }),

  // ============ CMS (Public) ============
  cms: router({
    banners: publicProcedure.query(async () => db.getActiveBannerSlides()),
    contentBlocks: publicProcedure
      .input(z.object({ pageKey: z.string() }))
      .query(async ({ input }) => db.getContentBlocks(input.pageKey)),
    page: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const page = await db.getStaticPageByKey(input.key);
        if (!page || !page.published) throw new TRPCError({ code: 'NOT_FOUND', message: 'Page not found' });
        return page;
      }),
    navigation: publicProcedure
      .input(z.object({ location: z.string().optional() }))
      .query(async ({ input }) => db.getNavigationItems(input.location)),
  }),

  // ============ SEO (Public) ============
  seo: router({
    getMeta: publicProcedure
      .input(z.object({ pageType: z.string(), entityId: z.number().optional() }))
      .query(async ({ input }) => db.getSeoMeta(input.pageType, input.entityId)),
  }),

  // ============ ADMIN ============
  admin: router({
    // ---- Dashboard ----
    dashboard: router({
      stats: adminProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional())
        .query(async ({ input }) => {
          const startDate = input?.startDate ? new Date(input.startDate) : undefined;
          const endDate = input?.endDate ? new Date(input.endDate) : undefined;
          return db.getDashboardStats(startDate, endDate);
        }),
      
      revenueChart: adminProcedure
        .input(z.object({ days: z.number().default(30) }).optional())
        .query(async ({ input }) => db.getRevenueByDay(input?.days || 30)),
      
      topProducts: adminProcedure
        .input(z.object({ limit: z.number().default(10) }).optional())
        .query(async ({ input }) => db.getTopProducts(input?.limit || 10)),
      
      ordersByStatus: adminProcedure.query(async () => db.getOrdersByStatus()),
      
      recentActivity: adminProcedure
        .input(z.object({ limit: z.number().default(20) }).optional())
        .query(async ({ input }) => db.getActivityLog({ limit: input?.limit || 20 })),
    }),

    // ---- Orders ----
    orders: router({
      list: adminProcedure
        .input(z.object({
          status: z.string().optional(),
          paymentStatus: z.string().optional(),
          search: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => {
          const result = await db.getAllOrders({
            status: input?.status,
            paymentStatus: input?.paymentStatus,
            search: input?.search,
            startDate: input?.startDate ? new Date(input.startDate) : undefined,
            endDate: input?.endDate ? new Date(input.endDate) : undefined,
            limit: input?.limit || 50,
            offset: input?.offset || 0,
          });
          
          // Enrich with user info
          const enriched = await Promise.all(
            result.orders.map(async (order) => {
              const user = await db.getUserById(order.userId);
              const items = await db.getOrderItems(order.id);
              return { ...order, user, items };
            })
          );
          
          return { orders: enriched, total: result.total };
        }),
      
      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const order = await db.getOrderById(input.id);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          const items = await db.getOrderItems(input.id);
          const user = await db.getUserById(order.userId);
          const history = await db.getOrderStatusHistory(input.id);
          return { ...order, items, user, statusHistory: history };
        }),
      
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned']),
          note: z.string().optional(),
          refundAmount: z.number().min(0).optional(), // Amount in sen to refund (only for 'returned' status)
          refundType: z.enum(['full', 'partial', 'none']).optional(), // Refund type (only for 'returned' status)
          refundReason: z.string().optional(), // Reason category for the refund
        }))
        .mutation(async ({ ctx, input }) => {
          const order = await db.getOrderById(input.id);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          
          const previousStatus = order.status;
          await db.updateOrderStatus(input.id, input.status);
          
          let refundResult: { refundId: string; refundedAmount: number } | null = null;
          
          // When marking as "returned", restore stock and process refund
          if (input.status === 'returned') {
            const database = await db.getDb();
            if (database) {
              const { orderItems: oiTable, orders: ordersTable } = await import('../drizzle/schema');
              const { eq: eqOp, sql: sqlOp } = await import('drizzle-orm');
              
              // Restore stock for all items
              const items = await database.select().from(oiTable).where(eqOp(oiTable.orderId, input.id));
              for (const item of items) {
                await database.execute(
                  sqlOp`UPDATE products SET stockQuantity = stockQuantity + ${item.quantity} WHERE id = ${item.productId}`
                );
              }
              console.log(`[Admin] Restored stock for ${items.length} items from returned order ${input.id}`);
              
              // Process Stripe refund if order has a paymentIntentId and refund is requested
              const shouldRefund = input.refundType && input.refundType !== 'none';
              if (shouldRefund && order.paymentIntentId) {
                const refundAmountSen = input.refundType === 'full'
                  ? order.totalAmount + (order.shippingCost || 0)
                  : (input.refundAmount || 0);
                try {
                  const { createRefund } = await import('./stripe');
                  
                  if (refundAmountSen <= 0) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Refund amount must be greater than 0' });
                  }
                  
                  const refund = await createRefund({
                    paymentIntentId: order.paymentIntentId,
                    amount: input.refundType === 'full' ? undefined : refundAmountSen,
                    reason: 'requested_by_customer',
                    metadata: {
                      order_id: input.id.toString(),
                      order_number: order.orderNumber,
                      admin_id: ctx.user.id.toString(),
                      refund_type: input.refundType || 'full',
                    },
                  });
                  
                  // Update order with refund info
                  await database.update(ordersTable).set({
                    paymentStatus: 'refunded',
                    refundedAmount: refundAmountSen,
                  }).where(eqOp(ordersTable.id, input.id));
                  
                  refundResult = {
                    refundId: refund.id,
                    refundedAmount: refundAmountSen,
                  };
                  
                  // Record refund in refunds table for history/accounting
                  try {
                    await db.createRefundRecord({
                      orderId: input.id,
                      orderNumber: order.orderNumber,
                      userId: order.userId,
                      adminId: ctx.user.id,
                      stripeRefundId: refund.id,
                      stripePaymentIntentId: order.paymentIntentId,
                      refundType: input.refundType as 'full' | 'partial',
                      refundAmount: refundAmountSen,
                      orderTotal: order.totalAmount + (order.shippingCost || 0),
                      reason: input.refundReason || 'requested_by_customer',
                      adminNote: input.note || null,
                      customerEmail: order.shippingEmail,
                      customerName: order.shippingName,
                      status: 'succeeded',
                    });
                  } catch (recErr) {
                    console.warn('[Admin] Failed to create refund record:', recErr);
                  }
                  
                  console.log(`[Admin] Stripe refund ${refund.id} issued for order ${input.id}: RM ${(refundAmountSen / 100).toFixed(2)} (${input.refundType})`);
                  
                  // Send refund confirmation email to customer
                  try {
                    const { sendRefundEmail } = await import('./email');
                    const origin = process.env.VITE_SITE_URL || 'http://localhost:3000';
                    await sendRefundEmail(
                      order.shippingEmail,
                      order.orderNumber,
                      refundAmountSen,
                      input.refundType === 'partial',
                      origin
                    );
                  } catch (emailErr) {
                    console.warn('[Admin] Failed to send refund email:', emailErr);
                  }
                } catch (stripeErr: any) {
                  console.error(`[Admin] Stripe refund failed for order ${input.id}:`, stripeErr);
                  // Record failed refund attempt
                  try {
                    await db.createRefundRecord({
                      orderId: input.id,
                      orderNumber: order.orderNumber,
                      userId: order.userId,
                      adminId: ctx.user.id,
                      stripeRefundId: null,
                      stripePaymentIntentId: order.paymentIntentId,
                      refundType: input.refundType as 'full' | 'partial',
                      refundAmount: refundAmountSen,
                      orderTotal: order.totalAmount + (order.shippingCost || 0),
                      reason: input.refundReason || 'requested_by_customer',
                      adminNote: input.note || null,
                      customerEmail: order.shippingEmail,
                      customerName: order.shippingName,
                      status: 'failed',
                      failureReason: stripeErr.message || 'Unknown error',
                    });
                  } catch (recErr) {
                    console.warn('[Admin] Failed to create failed refund record:', recErr);
                  }
                  // Don't throw — the return status is already updated, log the failure
                  // Admin can retry the refund manually via Stripe dashboard
                  await db.addOrderStatusHistory({
                    orderId: input.id,
                    previousStatus: 'returned',
                    newStatus: 'returned',
                    changedBy: ctx.user.id,
                    note: `Refund failed: ${stripeErr.message || 'Unknown error'}. Please process manually via Stripe dashboard.`,
                  });
                }
              } else if (shouldRefund && !order.paymentIntentId) {
                console.warn(`[Admin] Cannot refund order ${input.id}: no paymentIntentId found`);
                await db.addOrderStatusHistory({
                  orderId: input.id,
                  previousStatus: 'returned',
                  newStatus: 'returned',
                  changedBy: ctx.user.id,
                  note: 'Refund skipped: no Stripe payment intent found for this order.',
                });
              }
            }
          }
          
          // Log status change
          await db.addOrderStatusHistory({
            orderId: input.id,
            previousStatus,
            newStatus: input.status,
            changedBy: ctx.user.id,
            note: input.note,
          });
          
          // Log activity
          const activityDetails: Record<string, any> = { previousStatus, newStatus: input.status, note: input.note };
          if (refundResult) {
            activityDetails.refundId = refundResult.refundId;
            activityDetails.refundedAmount = refundResult.refundedAmount;
            activityDetails.refundType = input.refundType;
          }
          await db.logActivity({
            userId: ctx.user.id,
            action: 'order.status.update',
            entityType: 'order',
            entityId: input.id,
            details: JSON.stringify(activityDetails),
          });
          
          return { success: true, refund: refundResult };
        }),
      
      updateTracking: adminProcedure
        .input(z.object({
          id: z.number(),
          trackingNumber: z.string(),
          trackingUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.updateOrder(input.id, {
            trackingNumber: input.trackingNumber,
            trackingUrl: input.trackingUrl,
          });
          
          await db.logActivity({
            userId: ctx.user.id,
            action: 'order.tracking.update',
            entityType: 'order',
            entityId: input.id,
            details: JSON.stringify({ trackingNumber: input.trackingNumber }),
          });
          
          return { success: true };
        }),
      
      addNote: adminProcedure
        .input(z.object({ id: z.number(), note: z.string() }))
        .mutation(async ({ input }) => {
          const order = await db.getOrderById(input.id);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          const existingNotes = order.notes || '';
          const timestamp = new Date().toISOString();
          const newNotes = existingNotes ? `${existingNotes}\n[${timestamp}] ${input.note}` : `[${timestamp}] ${input.note}`;
          await db.updateOrder(input.id, { notes: newNotes });
          return { success: true };
        }),
    }),

    // ---- Products ----
    products: router({
      list: adminProcedure
        .input(z.object({
          search: z.string().optional(),
          categoryId: z.number().optional(),
          active: z.boolean().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => db.getAllProductsAdmin(input)),
      
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          price: z.number().min(0),
          compareAtPrice: z.number().optional(),
          sku: z.string().optional(),
          weight: z.number().optional(),
          categoryId: z.number(),
          stockQuantity: z.number().min(0).default(0),
          imageUrl: z.string().optional(),
          featured: z.boolean().default(false),
          active: z.boolean().default(true),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const existing = await db.getProductBySlug(input.slug);
          if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Product with this slug already exists' });
          
          await db.createProduct(input);
          
          await db.logActivity({
            userId: ctx.user.id,
            action: 'product.create',
            entityType: 'product',
            details: JSON.stringify({ name: input.name, slug: input.slug }),
          });
          
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.number().min(0).optional(),
          compareAtPrice: z.number().nullable().optional(),
          sku: z.string().nullable().optional(),
          weight: z.number().nullable().optional(),
          categoryId: z.number().optional(),
          stockQuantity: z.number().min(0).optional(),
          imageUrl: z.string().optional(),
          featured: z.boolean().optional(),
          active: z.boolean().optional(),
          metaTitle: z.string().nullable().optional(),
          metaDescription: z.string().nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { id, ...updates } = input;
          const product = await db.getProductById(id);
          if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
          
          if (updates.slug && updates.slug !== product.slug) {
            const existing = await db.getProductBySlug(updates.slug);
            if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Product with this slug already exists' });
          }
          
          await db.updateProduct(id, updates);
          
          await db.logActivity({
            userId: ctx.user.id,
            action: 'product.update',
            entityType: 'product',
            entityId: id,
            details: JSON.stringify(updates),
          });
          
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.deleteProduct(input.id);
          await db.logActivity({
            userId: ctx.user.id,
            action: 'product.delete',
            entityType: 'product',
            entityId: input.id,
          });
          return { success: true };
        }),
      
      uploadImage: adminProcedure
        .input(z.object({
          productId: z.number(),
          imageData: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          color: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const buffer = Buffer.from(input.imageData, 'base64');
          const fileKey = `products/${input.productId}/${nanoid()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          await db.addProductImage({
            productId: input.productId,
            imageUrl: url,
            fileKey,
            color: input.color,
            sortOrder: 0,
          });
          return { url, fileKey };
        }),
      
      deleteImage: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteProductImage(input.id);
          return { success: true };
        }),
    }),

    // ---- Categories ----
    categories: router({
      list: adminProcedure.query(async () => db.getAllCategories()),
      
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.createCategory(input);
          await db.logActivity({ userId: ctx.user.id, action: 'category.create', entityType: 'category', details: JSON.stringify(input) });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { id, ...updates } = input;
          await db.updateCategory(id, updates);
          await db.logActivity({ userId: ctx.user.id, action: 'category.update', entityType: 'category', entityId: id, details: JSON.stringify(updates) });
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.deleteCategory(input.id);
          await db.logActivity({ userId: ctx.user.id, action: 'category.delete', entityType: 'category', entityId: input.id });
          return { success: true };
        }),
    }),

    // ---- Inventory ----
    inventory: router({
      lowStock: adminProcedure
        .input(z.object({ threshold: z.number().default(10) }).optional())
        .query(async ({ input }) => db.getLowStockProducts(input?.threshold || 10)),
      
      outOfStock: adminProcedure.query(async () => db.getOutOfStockProducts()),
      
      updateStock: adminProcedure
        .input(z.object({ productId: z.number(), quantity: z.number().min(0) }))
        .mutation(async ({ ctx, input }) => {
          await db.updateProductStock(input.productId, input.quantity);
          await db.logActivity({
            userId: ctx.user.id,
            action: 'inventory.update',
            entityType: 'product',
            entityId: input.productId,
            details: JSON.stringify({ newQuantity: input.quantity }),
          });
          return { success: true };
        }),
      
      bulkUpdate: adminProcedure
        .input(z.object({
          updates: z.array(z.object({ productId: z.number(), quantity: z.number().min(0) })),
        }))
        .mutation(async ({ ctx, input }) => {
          for (const update of input.updates) {
            await db.updateProductStock(update.productId, update.quantity);
          }
          await db.logActivity({
            userId: ctx.user.id,
            action: 'inventory.bulk_update',
            entityType: 'product',
            details: JSON.stringify({ count: input.updates.length }),
          });
          return { success: true, updated: input.updates.length };
        }),
    }),

    // ---- Customers ----
    customers: router({
      list: adminProcedure
        .input(z.object({
          search: z.string().optional(),
          role: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => db.getAllUsers(input)),
      
      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const user = await db.getUserById(input.id);
          if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
          const userOrders = await db.getUserOrders(input.id);
          const totalSpent = userOrders
            .filter(o => o.paymentStatus === 'paid')
            .reduce((sum, o) => sum + o.totalAmount, 0);
          return { ...user, orders: userOrders, totalSpent, orderCount: userOrders.length };
        }),
      
      updateRole: adminProcedure
        .input(z.object({ id: z.number(), role: z.enum(['user', 'admin']) }))
        .mutation(async ({ ctx, input }) => {
          await db.updateUser(input.id, { role: input.role });
          await db.logActivity({
            userId: ctx.user.id,
            action: 'customer.role.update',
            entityType: 'user',
            entityId: input.id,
            details: JSON.stringify({ newRole: input.role }),
          });
          return { success: true };
        }),

      // PDPA/GDPR: Anonymize customer data (right to be forgotten)
      anonymize: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const user = await db.getUserById(input.id);
          if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
          if (user.role === 'admin') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot anonymize admin accounts' });

          const anonymizedEmail = `deleted-${input.id}@anonymized.local`;
          await db.updateUser(input.id, {
            name: 'Deleted User',
            email: anonymizedEmail,
            phone: null,
            passwordHash: null,
            avatarUrl: null,
            addressLine1: null,
            addressLine2: null,
            city: null,
            state: null,
            postalCode: null,
            country: null,
            googleId: null,
            facebookId: null,
            messengerPsid: null,
            marketingConsent: false,
            emailOptIn: false,
            smsOptIn: false,
            whatsappOptIn: false,
            messengerOptIn: false,
            resetToken: null,
            resetTokenExpiry: null,
            emailVerificationToken: null,
            emailVerificationExpiry: null,
            utmSource: null,
            utmMedium: null,
            utmCampaign: null,
            referralSource: null,
          });

          // Anonymize shipping details on orders (keep order for accounting)
          const database = await db.getDb();
          if (database) {
            const { orders: ordersTable } = await import('../drizzle/schema');
            const { eq: eqOp } = await import('drizzle-orm');
            await database.update(ordersTable).set({
              shippingName: 'Deleted User',
              shippingEmail: anonymizedEmail,
              shippingPhone: '000-000-0000',
              shippingAddress: 'Anonymized',
              shippingCity: 'Anonymized',
              shippingState: 'Anonymized',
              shippingPostalCode: '00000',
            }).where(eqOp(ordersTable.userId, input.id));
          }

          await db.logActivity({
            userId: ctx.user.id,
            action: 'customer.anonymize',
            entityType: 'user',
            entityId: input.id,
            details: JSON.stringify({ reason: 'PDPA/GDPR data deletion request' }),
          });

          return { success: true, message: 'Customer data anonymized. Order records retained for accounting.' };
        }),
      // Admin: Create a new customer manually
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1, 'Name is required').max(200),
          email: z.string().email('Invalid email format'),
          phone: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().default('Malaysia'),
          role: z.enum(['user', 'admin']).default('user'),
          customerGroup: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const database = await db.getDb();
          if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
          // Check if email already exists
          const existing = await db.getUserByEmail(input.email);
          if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'A customer with this email already exists' });
          const { users: usersTable } = await import('../drizzle/schema');
          const result = await database.insert(usersTable).values({
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            addressLine1: input.addressLine1 || null,
            addressLine2: input.addressLine2 || null,
            city: input.city || null,
            state: input.state || null,
            postalCode: input.postalCode || null,
            country: input.country,
            role: input.role,
            customerGroup: input.customerGroup || 'new',
            loginMethod: 'email',
            authProvider: 'email',
            profileCompleted: !!(input.addressLine1 && input.city && input.state && input.postalCode),
          });
          const newId = result[0].insertId;
          await db.logActivity({
            userId: ctx.user.id,
            action: 'customer.create',
            entityType: 'user',
            entityId: newId,
            details: JSON.stringify({ name: input.name, email: input.email }),
          });
          return { success: true, id: newId };
        }),

      // Admin: Update customer profile fields
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(1).max(200).optional(),
          phone: z.string().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          customerGroup: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const user = await db.getUserById(input.id);
          if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
          const { id, ...updates } = input;
          // Filter out undefined values
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
          );
          if (Object.keys(cleanUpdates).length === 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
          }
          await db.updateUser(input.id, cleanUpdates);
          await db.logActivity({
            userId: ctx.user.id,
            action: 'customer.update',
            entityType: 'user',
            entityId: input.id,
            details: JSON.stringify({ fields: Object.keys(cleanUpdates) }),
          });
          return { success: true };
        }),
    }),

    // ---- Promotions ----
    promotions: router({
      list: adminProcedure.query(async () => db.getAllPromotions()),
      
      create: adminProcedure
        .input(z.object({
          code: z.string().min(1),
          type: z.enum(['percentage', 'fixed', 'free_shipping']),
          value: z.number().min(0),
          minOrderAmount: z.number().optional(),
          maxUsage: z.number().optional(),
          perCustomerLimit: z.number().optional(),
          startDate: z.string(),
          endDate: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
          const existing = await db.getPromotionByCode(input.code);
          if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Promotion code already exists' });
          
          await db.createPromotion({
            ...input,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
          });
          
          await db.logActivity({ userId: ctx.user.id, action: 'promotion.create', entityType: 'promotion', details: JSON.stringify(input) });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          code: z.string().optional(),
          type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
          value: z.number().optional(),
          minOrderAmount: z.number().nullable().optional(),
          maxUsage: z.number().nullable().optional(),
          perCustomerLimit: z.number().nullable().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { id, startDate, endDate, ...rest } = input;
          const updates: any = { ...rest };
          if (startDate) updates.startDate = new Date(startDate);
          if (endDate) updates.endDate = new Date(endDate);
          await db.updatePromotion(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.deletePromotion(input.id);
          return { success: true };
        }),
      
      validate: publicProcedure
        .input(z.object({ code: z.string(), orderTotal: z.number() }))
        .query(async ({ input }) => {
          const promo = await db.getPromotionByCode(input.code.toUpperCase());
          if (!promo) return { valid: false, message: 'Invalid promotion code' };
          if (!promo.active) return { valid: false, message: 'Promotion is inactive' };
          
          const now = new Date();
          if (now < promo.startDate || now > promo.endDate) return { valid: false, message: 'Promotion has expired' };
          if (promo.maxUsage && promo.usageCount >= promo.maxUsage) return { valid: false, message: 'Promotion usage limit reached' };
          if (promo.minOrderAmount && input.orderTotal < promo.minOrderAmount) {
            return { valid: false, message: `Minimum order of RM ${(promo.minOrderAmount / 100).toFixed(2)} required` };
          }
          
          let discount = 0;
          if (promo.type === 'percentage') discount = Math.round(input.orderTotal * promo.value / 100);
          else if (promo.type === 'fixed') discount = promo.value;
          
          return { valid: true, discount, type: promo.type, value: promo.value, code: promo.code };
        }),
    }),

    // ---- Shipping Zones ----
    shipping: router({
      list: adminProcedure.query(async () => db.getAllShippingZones()),
      
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          states: z.string().optional(),
          flatRate: z.number().min(0),
          freeShippingThreshold: z.number().optional(),
          estimatedDays: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.createShippingZone(input);
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          states: z.string().optional(),
          flatRate: z.number().optional(),
          freeShippingThreshold: z.number().nullable().optional(),
          estimatedDays: z.string().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateShippingZone(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteShippingZone(input.id);
          return { success: true };
        }),
    }),

    // ---- Email Templates ----
    emailTemplates: router({
      list: adminProcedure.query(async () => db.getAllEmailTemplates()),
      
      getByKey: adminProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
          const template = await db.getEmailTemplateByKey(input.key);
          if (!template) throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
          return template;
        }),
      
      create: adminProcedure
        .input(z.object({
          key: z.string().min(1),
          name: z.string().min(1),
          subject: z.string().min(1),
          htmlBody: z.string().min(1),
          textBody: z.string().optional(),
          category: z.enum(['transactional', 'marketing', 'system']).default('transactional'),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.createEmailTemplate(input);
          await db.logActivity({ userId: ctx.user.id, action: 'email_template.create', entityType: 'emailTemplate', details: JSON.stringify({ key: input.key }) });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          htmlBody: z.string().optional(),
          textBody: z.string().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateEmailTemplate(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteEmailTemplate(input.id);
          return { success: true };
        }),
      
      sendTest: adminProcedure
        .input(z.object({ templateKey: z.string(), recipientEmail: z.string().email() }))
        .mutation(async ({ input }) => {
          await db.queueEmail({
            recipientEmail: input.recipientEmail,
            templateKey: input.templateKey,
            priority: 'high',
          });
          return { success: true, message: 'Test email queued' };
        }),
    }),

    // ---- Campaigns / Broadcast ----
    campaigns: router({
      list: adminProcedure.query(async () => db.getAllCampaigns()),
      
      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const campaign = await db.getCampaignById(input.id);
          if (!campaign) throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
          const messages = await db.getMessageLog({ campaignId: input.id, limit: 100 });
          return { ...campaign, messages };
        }),
      
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          channels: z.string(),
          audienceSegment: z.string(),
          emailTemplateId: z.number().optional(),
          whatsappTemplateKey: z.string().optional(),
          messengerContent: z.string().optional(),
          scheduledAt: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.createCampaign({
            ...input,
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
            createdBy: ctx.user.id,
          });
          await db.logActivity({ userId: ctx.user.id, action: 'campaign.create', entityType: 'campaign', details: JSON.stringify({ name: input.name }) });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          channels: z.string().optional(),
          audienceSegment: z.string().optional(),
          emailTemplateId: z.number().optional(),
          whatsappTemplateKey: z.string().optional(),
          messengerContent: z.string().optional(),
          scheduledAt: z.string().optional(),
          status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, scheduledAt, ...rest } = input;
          const updates: any = { ...rest };
          if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
          await db.updateCampaign(id, updates);
          return { success: true };
        }),
    }),

    // ---- Message Log ----
    messages: router({
      list: adminProcedure
        .input(z.object({
          channel: z.string().optional(),
          campaignId: z.number().optional(),
          limit: z.number().default(100),
        }).optional())
        .query(async ({ input }) => db.getMessageLog(input)),
    }),

    // ---- CMS: Banners ----
    banners: router({
      list: adminProcedure.query(async () => db.getAllBannerSlides()),
      
      create: adminProcedure
        .input(z.object({
          title: z.string().min(1),
          subtitle: z.string().optional(),
          imageUrl: z.string().min(1),
          mobileImageUrl: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          textColor: z.string().default('#FFFFFF'),
          overlayOpacity: z.number().default(40),
          sortOrder: z.number().default(0),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { startDate, endDate, ...rest } = input;
          await db.createBannerSlide({
            ...rest,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          });
          await db.logActivity({ userId: ctx.user.id, action: 'banner.create', entityType: 'banner', details: JSON.stringify({ title: input.title }) });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          imageUrl: z.string().optional(),
          mobileImageUrl: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          textColor: z.string().optional(),
          overlayOpacity: z.number().optional(),
          sortOrder: z.number().optional(),
          active: z.boolean().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, startDate, endDate, ...rest } = input;
          const updates: any = { ...rest };
          if (startDate) updates.startDate = new Date(startDate);
          if (endDate) updates.endDate = new Date(endDate);
          await db.updateBannerSlide(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await db.deleteBannerSlide(input.id);
          return { success: true };
        }),
    }),

    // ---- CMS: Content Blocks ----
    contentBlocks: router({
      list: adminProcedure.query(async () => db.getAllContentBlocks()),
      
      create: adminProcedure
        .input(z.object({
          pageKey: z.string().min(1),
          blockType: z.string().min(1),
          title: z.string().optional(),
          content: z.string().min(1),
          sortOrder: z.number().default(0),
        }))
        .mutation(async ({ input }) => {
          await db.createContentBlock(input);
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          sortOrder: z.number().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateContentBlock(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteContentBlock(input.id);
          return { success: true };
        }),
    }),

    // ---- CMS: Static Pages ----
    pages: router({
      list: adminProcedure.query(async () => db.getAllStaticPages()),
      
      create: adminProcedure
        .input(z.object({
          key: z.string().min(1),
          title: z.string().min(1),
          body: z.string().min(1),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          published: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          await db.createStaticPage(input);
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          body: z.string().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          published: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateStaticPage(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteStaticPage(input.id);
          return { success: true };
        }),
    }),

    // ---- CMS: Navigation ----
    navigation: router({
      list: adminProcedure.query(async () => db.getAllNavigationItems()),
      
      create: adminProcedure
        .input(z.object({
          location: z.enum(['header', 'footer', 'mobile']),
          label: z.string().min(1),
          url: z.string().min(1),
          sortOrder: z.number().default(0),
          parentId: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          await db.createNavigationItem(input);
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          label: z.string().optional(),
          url: z.string().optional(),
          sortOrder: z.number().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateNavigationItem(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteNavigationItem(input.id);
          return { success: true };
        }),
    }),

    // ---- Media Library ----
    media: router({
      list: adminProcedure
        .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
        .query(async ({ input }) => db.getAllMedia(input)),
      
      upload: adminProcedure
        .input(z.object({
          imageData: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          altText: z.string().optional(),
          tags: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const buffer = Buffer.from(input.imageData, 'base64');
          const fileKey = `media/${nanoid()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          
          await db.createMediaItem({
            fileName: input.fileName,
            fileKey,
            url,
            mimeType: input.mimeType,
            fileSize: buffer.length,
            altText: input.altText,
            tags: input.tags,
            uploadedBy: ctx.user.id,
          });
          
          return { url, fileKey };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteMediaItem(input.id);
          return { success: true };
        }),
    }),

    // ---- SEO ----
    seo: router({
      list: adminProcedure.query(async () => db.getAllSeoMeta()),
      
      upsert: adminProcedure
        .input(z.object({
          pageType: z.enum(['product', 'category', 'page', 'global']),
          entityId: z.number().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          focusKeyword: z.string().optional(),
          ogTitle: z.string().optional(),
          ogDescription: z.string().optional(),
          ogImage: z.string().optional(),
          noIndex: z.boolean().default(false),
          canonicalUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await db.upsertSeoMeta(input);
          await db.logActivity({ userId: ctx.user.id, action: 'seo.update', entityType: 'seo', details: JSON.stringify(input) });
          return { success: true };
        }),
      
      redirects: router({
        list: adminProcedure.query(async () => db.getAllRedirects()),
        
        create: adminProcedure
          .input(z.object({
            fromPath: z.string().min(1),
            toPath: z.string().min(1),
            type: z.enum(['301', '302']).default('301'),
          }))
          .mutation(async ({ input }) => {
            await db.createRedirect(input);
            return { success: true };
          }),
        
        update: adminProcedure
          .input(z.object({
            id: z.number(),
            fromPath: z.string().optional(),
            toPath: z.string().optional(),
            type: z.enum(['301', '302']).optional(),
            active: z.boolean().optional(),
          }))
          .mutation(async ({ input }) => {
            const { id, ...updates } = input;
            await db.updateRedirect(id, updates);
            return { success: true };
          }),
        
        delete: adminProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            await db.deleteRedirect(input.id);
            return { success: true };
          }),
      }),
    }),

    // ---- Site Settings ----
    settings: router({
      list: adminProcedure.query(async () => db.getAllSettings()),
      
      get: adminProcedure
        .input(z.object({ key: z.string() }))
        .query(async ({ input }) => {
          const value = await db.getSetting(input.key);
          return { key: input.key, value };
        }),
      
      set: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ ctx, input }) => {
          await db.upsertSetting(input.key, input.value);
          await db.logActivity({ userId: ctx.user.id, action: 'settings.update', entityType: 'settings', details: JSON.stringify(input) });
          return { success: true };
        }),
    }),

    // ---- Activity Log ----
    activity: router({
      list: adminProcedure
        .input(z.object({
          entityType: z.string().optional(),
          limit: z.number().default(100),
        }).optional())
        .query(async ({ input }) => db.getActivityLog(input)),
    }),

    // ---- Cart Recovery ----
    cartRecovery: router({
      abandonedCarts: adminProcedure
        .input(z.object({ olderThanHours: z.number().default(1) }).optional())
        .query(async ({ input }) => {
          const carts = await db.getAbandonedCarts(input?.olderThanHours || 1);
          // Enrich with user info
          const enriched = await Promise.all(
            carts.map(async (cart) => {
              const user = await db.getUserById(cart.userId);
              return { ...cart, user };
            })
          );
          return enriched;
        }),
    }),

    // ---- CSV Export ----
    export: router({
      products: adminProcedure.query(async ({ ctx }) => {
        const products = await db.getAllProductsForExport();
        
        const headers = [
          'ID', 'Name', 'Slug', 'Description', 'Price (RM)', 'Compare At Price (RM)',
          'SKU', 'Weight (g)', 'Category', 'Stock Quantity', 'Image URL',
          'Product Type', 'Featured', 'Active', 'Meta Title', 'Meta Description',
          'Created At', 'Updated At'
        ];
        
        const rows = products.map(p => [
          p.id,
          p.name,
          p.slug,
          (p.description || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""'),
          (p.price / 100).toFixed(2),
          p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : '',
          p.sku || '',
          p.weight || '',
          p.categoryName || `Category ${p.categoryId}`,
          p.stockQuantity,
          p.imageUrl || '',
          p.productType,
          p.featured ? 'Yes' : 'No',
          p.active ? 'Yes' : 'No',
          p.metaTitle || '',
          (p.metaDescription || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""'),
          p.createdAt ? new Date(p.createdAt).toISOString() : '',
          p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
        ]);
        
        const csvContent = [
          headers.map(h => `"${h}"`).join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'export.products.csv',
          entityType: 'product',
          details: JSON.stringify({ count: products.length }),
        });
        
        return { csv: csvContent, count: products.length, filename: `products-export-${new Date().toISOString().slice(0,10)}.csv` };
      }),

      orders: adminProcedure
        .input(z.object({
          status: z.string().optional(),
          paymentStatus: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
          const orders = await db.getAllOrdersForExport({
            status: input?.status,
            paymentStatus: input?.paymentStatus,
            startDate: input?.startDate ? new Date(input.startDate) : undefined,
            endDate: input?.endDate ? new Date(input.endDate) : undefined,
          });
          
          const headers = [
            'Order ID', 'Order Number', 'Status', 'Payment Status',
            'Total (RM)', 'Shipping Cost (RM)', 'Refunded (RM)',
            'Customer Name', 'Customer Email',
            'Shipping Name', 'Shipping Email', 'Shipping Phone',
            'Shipping Address', 'City', 'State', 'Postal Code', 'Country',
            'Shipping Method', 'Tracking Number', 'Tracking URL',
            'Items Count', 'Items Summary',
            'Payment Intent ID', 'Notes',
            'Created At', 'Updated At'
          ];
          
          const rows = orders.map(o => [
            o.id,
            o.orderNumber,
            o.status,
            o.paymentStatus,
            (o.totalAmount / 100).toFixed(2),
            (o.shippingCost / 100).toFixed(2),
            (o.refundedAmount / 100).toFixed(2),
            o.customerName || '',
            o.customerEmail || '',
            o.shippingName,
            o.shippingEmail,
            o.shippingPhone,
            (o.shippingAddress || '').replace(/[\r\n]+/g, ' '),
            o.shippingCity,
            o.shippingState,
            o.shippingPostalCode,
            o.shippingCountry,
            o.shippingMethod || '',
            o.trackingNumber || '',
            o.trackingUrl || '',
            o.itemCount,
            o.itemsSummary,
            o.paymentIntentId || '',
            (o.notes || '').replace(/[\r\n]+/g, ' '),
            o.createdAt ? new Date(o.createdAt).toISOString() : '',
            o.updatedAt ? new Date(o.updatedAt).toISOString() : '',
          ]);
          
          const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          ].join('\n');
          
          await db.logActivity({
            userId: ctx.user.id,
            action: 'export.orders.csv',
            entityType: 'order',
            details: JSON.stringify({ count: orders.length, filters: input }),
          });
          
          return { csv: csvContent, count: orders.length, filename: `orders-export-${new Date().toISOString().slice(0,10)}.csv` };
        }),

      customers: adminProcedure.query(async ({ ctx }) => {
        const customers = await db.getAllCustomersForExport();
        
        const headers = [
          'ID', 'Name', 'Email', 'Phone', 'Role', 'Customer Group',
          'Lifetime Value (RM)', 'Total Orders', 'Avg Order Value (RM)',
          'First Purchase', 'Last Purchase',
          'Address Line 1', 'Address Line 2', 'City', 'State', 'Postal Code', 'Country',
          'Marketing Consent', 'Consent Date', 'Email Opt-In', 'SMS Opt-In',
          'WhatsApp Opt-In', 'Messenger Opt-In',
          'Tags', 'Referral Source', 'UTM Source', 'UTM Medium', 'UTM Campaign',
          'Auth Provider', 'Profile Completed', 'Registered At', 'Last Sign In'
        ];
        
        const rows = customers.map(c => [
          c.id,
          c.name || '',
          c.email,
          c.phone || '',
          c.role,
          c.customerGroup || 'new',
          (c.lifetimeValue / 100).toFixed(2),
          c.totalOrders,
          (c.averageOrderValue / 100).toFixed(2),
          c.firstPurchaseDate ? new Date(c.firstPurchaseDate).toISOString() : '',
          c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toISOString() : '',
          c.addressLine1 || '',
          c.addressLine2 || '',
          c.city || '',
          c.state || '',
          c.postalCode || '',
          c.country || '',
          c.marketingConsent ? 'Yes' : 'No',
          c.consentDate ? new Date(c.consentDate).toISOString() : '',
          c.emailOptIn ? 'Yes' : 'No',
          c.smsOptIn ? 'Yes' : 'No',
          c.whatsappOptIn ? 'Yes' : 'No',
          c.messengerOptIn ? 'Yes' : 'No',
          c.tags || '',
          c.referralSource || '',
          c.utmSource || '',
          c.utmMedium || '',
          c.utmCampaign || '',
          c.authProvider,
          c.profileCompleted ? 'Yes' : 'No',
          c.createdAt ? new Date(c.createdAt).toISOString() : '',
          c.lastSignedIn ? new Date(c.lastSignedIn).toISOString() : '',
        ]);
        
        const csvContent = [
          headers.map(h => `"${h}"`).join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        await db.logActivity({
          userId: ctx.user.id,
          action: 'export.customers.csv',
          entityType: 'user',
          details: JSON.stringify({ count: customers.length }),
        });
        
        return { csv: csvContent, count: customers.length, filename: `customers-export-${new Date().toISOString().slice(0,10)}.csv` };
      }),

      analytics: adminProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
          const report = await db.getSalesReportForExport(
            input?.startDate ? new Date(input.startDate) : undefined,
            input?.endDate ? new Date(input.endDate) : undefined,
          );
          
          // Daily revenue CSV
          const dailyHeaders = ['Date', 'Revenue (RM)', 'Order Count', 'Avg Order Value (RM)'];
          const dailyRows = report.dailyRevenue.map(d => [
            d.date,
            (Number(d.revenue || 0) / 100).toFixed(2),
            d.orderCount,
            (Number(d.avgOrderValue || 0) / 100).toFixed(2),
          ]);
          
          // Top products CSV
          const productHeaders = ['Product ID', 'Product Name', 'Units Sold', 'Revenue (RM)', 'Order Count'];
          const productRows = report.topProducts.map(p => [
            p.productId,
            p.productName,
            p.totalQuantity || 0,
            (Number(p.totalRevenue || 0) / 100).toFixed(2),
            p.orderCount,
          ]);
          
          // Summary line
          const summaryLine = `"SUMMARY","Total Revenue: RM ${(report.summary.totalRevenue / 100).toFixed(2)}","Total Orders: ${report.summary.totalOrders}","Avg Order: RM ${(report.summary.avgOrderValue / 100).toFixed(2)}"`;
          
          const csvContent = [
            '"=== DAILY REVENUE ==="',
            dailyHeaders.map(h => `"${h}"`).join(','),
            ...dailyRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            '',
            '"=== TOP PRODUCTS ==="',
            productHeaders.map(h => `"${h}"`).join(','),
            ...productRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            '',
            summaryLine,
          ].join('\n');
          
          await db.logActivity({
            userId: ctx.user.id,
            action: 'export.analytics.csv',
            entityType: 'report',
            details: JSON.stringify({ 
              dateRange: { start: input?.startDate, end: input?.endDate },
              dailyRows: report.dailyRevenue.length,
              topProducts: report.topProducts.length,
            }),
          });
          
          const dateRange = input?.startDate && input?.endDate 
            ? `${input.startDate}-to-${input.endDate}` 
            : 'all-time';
          
          return { 
            csv: csvContent, 
            count: report.dailyRevenue.length,
            summary: report.summary,
            filename: `sales-report-${new Date().toISOString().slice(0,10)}.csv` 
          };
        }),
    }),

    // ---- Admin Invites ----
    invites: router({
      list: adminProcedure.query(async () => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { adminInvites, users } = await import('../drizzle/schema');
        const { desc, eq } = await import('drizzle-orm');
        const rows = await dbConn.select().from(adminInvites).orderBy(desc(adminInvites.createdAt)).limit(50);
        // Enrich with inviter name
        const enriched = await Promise.all(rows.map(async (inv) => {
          const inviter = await db.getUserById(inv.invitedBy);
          return { ...inv, inviterName: inviter?.name || inviter?.email || 'Unknown' };
        }));
        return enriched;
      }),

      create: adminProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ input, ctx }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { adminInvites, users } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          // Check if email already has an admin account
          const existing = await dbConn.select().from(users).where(eq(users.email, input.email)).limit(1);
          if (existing.length > 0 && existing[0].role === 'admin') {
            throw new TRPCError({ code: 'CONFLICT', message: 'This email already has an admin account' });
          }
          
          // Check for pending invite
          const pendingInvite = await dbConn.select().from(adminInvites)
            .where(eq(adminInvites.email, input.email)).limit(1);
          if (pendingInvite.length > 0 && pendingInvite[0].status === 'pending' && pendingInvite[0].expiresAt > new Date()) {
            throw new TRPCError({ code: 'CONFLICT', message: 'A pending invite already exists for this email' });
          }
          
          const token = nanoid(48);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          
          await dbConn.insert(adminInvites).values({
            email: input.email,
            token,
            invitedBy: ctx.user.id,
            expiresAt,
          });
          
          // Send invite email
          const { sendAdminInviteEmail } = await import('./email');
          await sendAdminInviteEmail(input.email, token, ctx.user.name || ctx.user.email);
          
          // Audit log
          const { logAdminAction, getClientIp } = await import('./auditLog');
          await logAdminAction({
            userId: ctx.user.id,
            action: 'admin.invite.create',
            entityType: 'invite',
            details: JSON.stringify({ email: input.email }),
            ipAddress: getClientIp(ctx.req),
          });
          
          return { success: true, message: `Invite sent to ${input.email}` };
        }),

      revoke: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { adminInvites } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          await dbConn.update(adminInvites)
            .set({ status: 'revoked' })
            .where(eq(adminInvites.id, input.id));
          
          const { logAdminAction, getClientIp } = await import('./auditLog');
          await logAdminAction({
            userId: ctx.user.id,
            action: 'admin.invite.revoke',
            entityType: 'invite',
            entityId: input.id,
            ipAddress: getClientIp(ctx.req),
          });
          
          return { success: true };
        }),
    }),

    // ---- Accept Admin Invite (Public — token-based) ----
    acceptInvite: router({
      validate: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ input }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { adminInvites } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const [invite] = await dbConn.select().from(adminInvites).where(eq(adminInvites.token, input.token)).limit(1);
          if (!invite) return { valid: false, email: null, error: 'Invalid invite token' };
          if (invite.status !== 'pending') return { valid: false, email: null, error: 'This invite has already been used or revoked' };
          if (invite.expiresAt < new Date()) return { valid: false, email: null, error: 'This invite has expired' };
          return { valid: true, email: invite.email, error: null };
        }),

      accept: publicProcedure
        .input(z.object({
          token: z.string(),
          name: z.string().min(1, 'Name is required'),
          password: z.string().min(12, 'Admin password must be at least 12 characters'),
        }))
        .mutation(async ({ input }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { adminInvites, users } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const [invite] = await dbConn.select().from(adminInvites).where(eq(adminInvites.token, input.token)).limit(1);
          if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invite token' });
          if (invite.status !== 'pending') throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invite has already been used or revoked' });
          if (invite.expiresAt < new Date()) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invite has expired' });
          
          // Validate admin password strength
          const validation = adminAuth.isValidAdminPassword(input.password);
          if (!validation.valid) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: validation.message });
          }
          
          const passwordHash = await auth.hashPassword(input.password);
          
          // Check if user already exists
          const [existingUser] = await dbConn.select().from(users).where(eq(users.email, invite.email)).limit(1);
          
          if (existingUser) {
            // Promote existing user to admin
            await dbConn.update(users).set({
              role: 'admin',
              name: input.name,
              passwordHash,
            }).where(eq(users.id, existingUser.id));
          } else {
            // Create new admin user
            await dbConn.insert(users).values({
              email: invite.email,
              name: input.name,
              passwordHash,
              role: 'admin',
              loginMethod: 'email',
              authProvider: 'email',
              emailVerified: true,
            });
          }
          
          // Mark invite as accepted
          await dbConn.update(adminInvites).set({
            status: 'accepted',
            acceptedAt: new Date(),
          }).where(eq(adminInvites.id, invite.id));
          
          return { success: true, message: 'Admin account created. You can now log in.' };
        }),
    }),

    // ---- Returns Management ----
    returns: router({
      list: adminProcedure
        .input(z.object({
          status: z.enum(['return_requested', 'returned', 'all']).default('return_requested'),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { orders, users } = await import('../drizzle/schema');
          const { desc, eq, inArray, sql, and } = await import('drizzle-orm');
          
          const statusFilter = input?.status || 'return_requested';
          const limit = input?.limit || 50;
          const offset = input?.offset || 0;
          
          let whereClause;
          if (statusFilter === 'all') {
            whereClause = inArray(orders.status, ['return_requested', 'returned']);
          } else {
            whereClause = eq(orders.status, statusFilter);
          }
          
          const returnOrders = await dbConn.select().from(orders)
            .where(whereClause)
            .orderBy(desc(orders.updatedAt))
            .limit(limit)
            .offset(offset);
          
          const [countResult] = await dbConn.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause);
          
          // Enrich with user info and items
          const enriched = await Promise.all(returnOrders.map(async (order) => {
            const user = await db.getUserById(order.userId);
            const items = await db.getOrderItems(order.id);
            // Get the return request note from status history
            const { orderStatusHistory } = await import('../drizzle/schema');
            const history = await dbConn.select().from(orderStatusHistory)
              .where(and(eq(orderStatusHistory.orderId, order.id), eq(orderStatusHistory.newStatus, 'return_requested')))
              .orderBy(desc(orderStatusHistory.createdAt))
              .limit(1);
            return {
              ...order,
              user: user ? { id: user.id, name: user.name, email: user.email } : null,
              items,
              returnReason: history[0]?.note || null,
              returnRequestedAt: history[0]?.createdAt || null,
            };
          }));
          
          return { returns: enriched, total: countResult?.count || 0 };
        }),

      stats: adminProcedure.query(async () => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { orders } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        
        const [pending] = await dbConn.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'return_requested'));
        const [processed] = await dbConn.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'returned'));
        
        return {
          pendingReturns: pending?.count || 0,
          processedReturns: processed?.count || 0,
        };
      }),
    }),

    // ---- Audit Log ----
    auditLog: router({
      list: adminProcedure
        .input(z.object({
          action: z.string().optional(),
          userId: z.number().optional(),
          entityType: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => {
          const dbConn = await db.getDb();
          if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          const { activityLog, users } = await import('../drizzle/schema');
          const { desc, eq, and, gte, lte, like, sql } = await import('drizzle-orm');
          
          const conditions = [];
          if (input?.action) conditions.push(like(activityLog.action, `%${input.action}%`));
          if (input?.userId) conditions.push(eq(activityLog.userId, input.userId));
          if (input?.entityType) conditions.push(eq(activityLog.entityType, input.entityType));
          if (input?.startDate) conditions.push(gte(activityLog.createdAt, new Date(input.startDate)));
          if (input?.endDate) conditions.push(lte(activityLog.createdAt, new Date(input.endDate)));
          if (input?.search) {
            conditions.push(like(activityLog.details, `%${input.search}%`));
          }
          
          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
          const limit = input?.limit || 50;
          const offset = input?.offset || 0;
          
          const logs = await dbConn.select().from(activityLog)
            .where(whereClause)
            .orderBy(desc(activityLog.createdAt))
            .limit(limit)
            .offset(offset);
          
          const [countResult] = await dbConn.select({ count: sql<number>`count(*)` }).from(activityLog).where(whereClause);
          
          // Enrich with admin user names
          const enriched = await Promise.all(logs.map(async (log) => {
            const user = await db.getUserById(log.userId);
            return {
              ...log,
              userName: user?.name || user?.email || 'Unknown',
            };
          }));
          
          return { logs: enriched, total: countResult?.count || 0 };
        }),

      actionTypes: adminProcedure.query(async () => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { activityLog } = await import('../drizzle/schema');
        const { sql } = await import('drizzle-orm');
        
        const types = await dbConn.select({ action: activityLog.action, count: sql<number>`count(*)` })
          .from(activityLog)
          .groupBy(activityLog.action)
          .orderBy(activityLog.action);
        return types;
      }),

      adminUsers: adminProcedure.query(async () => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const admins = await dbConn.select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.role, 'admin'));
        return admins;
      }),
    }),

    // ---- Refund History ----
    refunds: router({
      list: adminProcedure
        .input(z.object({
          search: z.string().optional(),
          refundType: z.enum(['full', 'partial', 'all']).default('all'),
          status: z.enum(['succeeded', 'pending', 'failed', 'all']).default('all'),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        }).optional())
        .query(async ({ input }) => {
          return db.getRefundHistory({
            search: input?.search,
            refundType: input?.refundType,
            status: input?.status,
            startDate: input?.startDate,
            endDate: input?.endDate,
            limit: input?.limit,
            offset: input?.offset,
          });
        }),

      stats: adminProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional())
        .query(async ({ input }) => {
          return db.getRefundStats(input?.startDate, input?.endDate);
        }),

      export: adminProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          refundType: z.enum(['full', 'partial', 'all']).optional(),
          status: z.enum(['succeeded', 'pending', 'failed', 'all']).optional(),
        }).optional())
        .mutation(async ({ ctx, input }) => {
          const rows = await db.getAllRefundsForExport({
            startDate: input?.startDate,
            endDate: input?.endDate,
            refundType: input?.refundType,
            status: input?.status,
          });

          // Build CSV
          const BOM = '\uFEFF';
          const headers = [
            'Refund ID', 'Stripe Refund ID', 'Order Number', 'Customer Name', 'Customer Email',
            'Refund Type', 'Refund Amount (RM)', 'Order Total (RM)', 'Status',
            'Reason', 'Admin Note', 'Stripe Payment Intent', 'Date'
          ];

          const escCsv = (v: string | null | undefined) => {
            const s = v ?? '';
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
          };

          const csvRows = rows.map(r => [
            r.id.toString(),
            escCsv(r.stripeRefundId),
            escCsv(r.orderNumber),
            escCsv(r.customerName),
            escCsv(r.customerEmail),
            r.refundType,
            (r.refundAmount / 100).toFixed(2),
            (r.orderTotal / 100).toFixed(2),
            r.status,
            escCsv(r.reason),
            escCsv(r.adminNote),
            escCsv(r.stripePaymentIntentId),
            r.createdAt ? new Date(r.createdAt).toISOString() : '',
          ].join(','));

          const csv = BOM + headers.join(',') + '\n' + csvRows.join('\n');

          await db.logActivity({
            userId: ctx.user.id,
            action: 'refund.export',
            entityType: 'refund',
            details: JSON.stringify({ count: rows.length, filters: input }),
          });

          return { csv, count: rows.length };
        }),

      exportPdf: adminProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          refundType: z.enum(['full', 'partial', 'all']).optional(),
          status: z.enum(['succeeded', 'pending', 'failed', 'all']).optional(),
        }).optional())
        .mutation(async ({ ctx, input }) => {
          const PDFDocument = (await import('pdfkit')).default;
          const rows = await db.getAllRefundsForExport({
            startDate: input?.startDate,
            endDate: input?.endDate,
            refundType: input?.refundType,
            status: input?.status,
          });
          const stats = await db.getRefundStats(input?.startDate, input?.endDate);

          // Generate PDF in memory
          const chunks: Buffer[] = [];
          const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          const pdfDone = new Promise<void>((resolve) => doc.on('end', resolve));

          // Header
          doc.fontSize(18).font('Helvetica-Bold').text('Refund History Report', { align: 'center' });
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica').fillColor('#666666')
            .text(`Fake by Freetown — Generated ${new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
          if (input?.startDate || input?.endDate) {
            doc.text(`Date range: ${input?.startDate || 'All'} to ${input?.endDate || 'Present'}`, { align: 'center' });
          }
          doc.moveDown(1);

          // Stats summary
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('Summary');
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica').fillColor('#333333');
          doc.text(`Total Refunds: ${stats.refundCount}    |    Total Refunded: RM ${(stats.totalRefunded / 100).toFixed(2)}    |    Full: ${stats.fullRefunds}    |    Partial: ${stats.partialRefunds}    |    Failed: ${stats.failedRefunds}    |    Avg: RM ${(stats.avgRefundAmount / 100).toFixed(2)}`);
          doc.moveDown(1);

          // Table
          const colWidths = [55, 70, 70, 90, 55, 65, 65, 60, 80, 100];
          const headers = ['Date', 'Order #', 'Customer', 'Email', 'Type', 'Amount', 'Order Total', 'Status', 'Reason', 'Stripe Refund ID'];
          const startX = 40;
          let y = doc.y;

          // Header row
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
          doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 16).fill('#1a1a2e');
          let x = startX;
          headers.forEach((h, i) => {
            doc.fillColor('#ffffff').text(h, x + 3, y + 4, { width: colWidths[i] - 6, lineBreak: false });
            x += colWidths[i];
          });
          y += 16;

          const reasonLabels: Record<string, string> = {
            requested_by_customer: 'Customer Request',
            defective_item: 'Defective',
            wrong_item: 'Wrong Item',
            not_as_described: 'Not As Described',
            size_issue: 'Size Issue',
            late_delivery: 'Late Delivery',
            duplicate_order: 'Duplicate',
            other: 'Other',
          };

          // Data rows
          doc.font('Helvetica').fontSize(6.5).fillColor('#333333');
          rows.forEach((r, idx) => {
            if (y > 540) {
              doc.addPage();
              y = 40;
              // Re-draw header on new page
              doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
              doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 16).fill('#1a1a2e');
              let hx = startX;
              headers.forEach((h, i) => {
                doc.fillColor('#ffffff').text(h, hx + 3, y + 4, { width: colWidths[i] - 6, lineBreak: false });
                hx += colWidths[i];
              });
              y += 16;
              doc.font('Helvetica').fontSize(6.5).fillColor('#333333');
            }

            const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
            doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 14).fill(bg);

            const vals = [
              r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: '2-digit' }) : '',
              r.orderNumber || '',
              (r.customerName || '').slice(0, 15),
              (r.customerEmail || '').slice(0, 18),
              r.refundType === 'full' ? 'Full' : 'Partial',
              `RM ${(r.refundAmount / 100).toFixed(2)}`,
              `RM ${(r.orderTotal / 100).toFixed(2)}`,
              r.status.charAt(0).toUpperCase() + r.status.slice(1),
              reasonLabels[r.reason || ''] || r.reason || '',
              (r.stripeRefundId || '').slice(0, 20),
            ];

            let rx = startX;
            doc.fillColor('#333333');
            vals.forEach((v, i) => {
              doc.text(v, rx + 3, y + 4, { width: colWidths[i] - 6, lineBreak: false });
              rx += colWidths[i];
            });
            y += 14;
          });

          // Footer
          doc.moveDown(2);
          doc.fontSize(8).fillColor('#999999').text(`${rows.length} refund record(s)`, startX, y + 10);

          doc.end();
          await pdfDone;

          const pdfBuffer = Buffer.concat(chunks);
          const base64 = pdfBuffer.toString('base64');

          await db.logActivity({
            userId: ctx.user.id,
            action: 'refund.export_pdf',
            entityType: 'refund',
            details: JSON.stringify({ count: rows.length, filters: input }),
          });

          return { pdf: base64, count: rows.length };
        }),

      // Refund trends for analytics chart
      trends: adminProcedure
        .input(z.object({
          period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
          days: z.number().default(30), // how many days back to look
        }).optional())
        .query(async ({ input }) => {
          return db.getRefundTrends(input?.period || 'daily', input?.days || 30);
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
