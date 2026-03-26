import { COOKIE_NAME } from "@shared/const";
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
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
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
      .mutation(async ({ input }) => {
        const user = await auth.getUserByEmail(input.email);
        if (!user) return { success: true, message: 'If email exists, reset link sent' };
        const token = auth.generateResetToken();
        await auth.setResetToken(input.email, token);
        console.log(`Password reset token for ${input.email}: ${token}`);
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
        size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
        color: z.enum(['black', 'white', 'navy', 'red']),
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
        const cartItems = await db.getCartItems(ctx.user.id);
        if (cartItems.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        
        for (const item of cartItems) {
          if (!item.product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found in cart' });
          if (item.product.stockQuantity < item.quantity) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Insufficient stock for ${item.product.name}` });
          }
        }
        
        const orderNumber = `ORD-${nanoid(10).toUpperCase()}`;
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
        
        await db.createOrder({
          userId: ctx.user.id, orderNumber, totalAmount,
          shippingName: input.shippingName, shippingEmail: input.shippingEmail,
          shippingPhone: input.shippingPhone, shippingAddress: input.shippingAddress,
          shippingCity: input.shippingCity, shippingState: input.shippingState,
          shippingPostalCode: input.shippingPostalCode, shippingCountry: input.shippingCountry,
          status: 'pending', paymentStatus: 'pending',
        });
        
        const order = await db.getOrderByNumber(orderNumber);
        if (!order) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });
        
        for (const item of cartItems) {
          if (!item.product) continue;
          await db.createOrderItem({
            orderId: order.id, productId: item.productId,
            productName: item.product.name, productPrice: item.product.price,
            quantity: item.quantity, size: item.size, color: item.color,
            subtotal: item.product.price * item.quantity,
          });
        }
        
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        const session = await createCheckoutSession({
          userId: ctx.user.id, userEmail: ctx.user.email || '', userName: ctx.user.name || '',
          items: cartItems.map(item => ({
            name: item.product!.name, description: item.product!.description || undefined,
            price: item.product!.price, quantity: item.quantity,
            images: item.product!.imageUrl ? [item.product!.imageUrl] : undefined,
          })),
          origin, orderId: order.id, orderNumber: order.orderNumber,
        });
        
        return { sessionId: session.id, url: session.url, orderNumber: order.orderNumber };
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
          status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
          note: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const order = await db.getOrderById(input.id);
          if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
          
          const previousStatus = order.status;
          await db.updateOrderStatus(input.id, input.status);
          
          // Log status change
          await db.addOrderStatusHistory({
            orderId: input.id,
            previousStatus,
            newStatus: input.status,
            changedBy: ctx.user.id,
            note: input.note,
          });
          
          // Log activity
          await db.logActivity({
            userId: ctx.user.id,
            action: 'order.status.update',
            entityType: 'order',
            entityId: input.id,
            details: JSON.stringify({ previousStatus, newStatus: input.status, note: input.note }),
          });
          
          return { success: true };
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
  }),
});

export type AppRouter = typeof appRouter;
