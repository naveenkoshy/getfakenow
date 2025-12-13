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
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate email format
        if (!auth.isValidEmail(input.email)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid email format' });
        }
        
        // Validate password strength
        if (!auth.isValidPassword(input.password)) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
          });
        }
        
        // Check if user already exists
        const existingUser = await auth.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
        }
        
        // Create user
        await auth.createUser({
          email: input.email,
          password: input.password,
          name: input.name,
        });
        
        // Get the created user
        const user = await auth.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        }
        
        // Create JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          ENV.jwtSecret,
          { expiresIn: '30d' }
        );
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get user by email
        const user = await auth.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        }
        
        // Verify password
        const isValid = await auth.verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        }
        
        // Update last sign-in
        await auth.updateLastSignIn(user.id);
        
        // Create JWT token
        const expiresIn = input.rememberMe ? '30d' : '7d';
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          ENV.jwtSecret,
          { expiresIn }
        );
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const maxAge = input.rememberMe 
          ? 30 * 24 * 60 * 60 * 1000 // 30 days
          : 7 * 24 * 60 * 60 * 1000;  // 7 days
        
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge,
        });
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }),
    
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await auth.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists for security
          return { success: true, message: 'If email exists, reset link sent' };
        }
        
        const token = auth.generateResetToken();
        await auth.setResetToken(input.email, token);
        
        // TODO: Send email with reset link
        // For now, just return success
        console.log(`Password reset token for ${input.email}: ${token}`);
        
        return { success: true, message: 'If email exists, reset link sent' };
      }),
    
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        if (!auth.isValidPassword(input.newPassword)) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
          });
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
  }),

  // Categories
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        }
        return category;
      }),
  }),

  // Products
  products: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllProducts(input);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        
        // Get category info
        const category = await db.getCategoryById(product.categoryId);
        
        // Get additional images
        const images = await db.getProductImages(input.id);
        
        return {
          ...product,
          category,
          images,
        };
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductBySlug(input.slug);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        
        const category = await db.getCategoryById(product.categoryId);
        const images = await db.getProductImages(product.id);
        
        return {
          ...product,
          category,
          images,
        };
      }),
  }),

  // Shopping Cart
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      
      // Calculate total
      const total = items.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.quantity;
      }, 0);
      
      return {
        items,
        total,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
        color: z.enum(['black', 'white', 'navy', 'red']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if product exists and has stock
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }
        
        if (product.stockQuantity < input.quantity) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient stock' });
        }
        
        await db.addToCart({
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity,
          size: input.size,
          color: input.color,
        });
        
        return { success: true };
      }),
    
    updateQuantity: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(0),
      }))
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

  // Stripe Checkout
  checkout: router({
    createSession: protectedProcedure
      .input(z.object({
        shippingAddress: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get cart items
        const cartItems = await db.getCartItems(ctx.user.id);
        
        if (cartItems.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        }
        
        // Check stock availability
        for (const item of cartItems) {
          if (!item.product) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found in cart' });
          }
          
          if (item.product.stockQuantity < item.quantity) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: `Insufficient stock for ${item.product.name}` 
            });
          }
        }
        
        // Generate order number
        const orderNumber = `ORD-${nanoid(10).toUpperCase()}`;
        
        // Calculate total
        const totalAmount = cartItems.reduce((sum, item) => {
          return sum + (item.product?.price || 0) * item.quantity;
        }, 0);
        
        // Create pending order
        await db.createOrder({
          userId: ctx.user.id,
          orderNumber,
          totalAmount,
          shippingAddress: input.shippingAddress,
          status: 'pending',
          paymentStatus: 'pending',
        });
        
        // Get the created order
        const order = await db.getOrderByNumber(orderNumber);
        if (!order) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create order' });
        }
        
        // Create order items
        for (const item of cartItems) {
          if (!item.product) continue;
          
          await db.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            subtotal: item.product.price * item.quantity,
          });
        }
        
        // Create Stripe checkout session
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          items: cartItems.map(item => ({
            name: item.product!.name,
            description: item.product!.description || undefined,
            price: item.product!.price,
            quantity: item.quantity,
            images: item.product!.imageUrl ? [item.product!.imageUrl] : undefined,
          })),
          origin,
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
        
        return {
          sessionId: session.id,
          url: session.url,
          orderNumber: order.orderNumber,
        };
      }),
  }),

  // Orders
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserOrders(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        
        // Check if user owns this order or is admin
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const items = await db.getOrderItems(input.id);
        
        return {
          ...order,
          items,
        };
      }),
    
    getByNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const items = await db.getOrderItems(order.id);
        
        return {
          ...order,
          items,
        };
      }),
  }),

  // Admin operations
  admin: router({
    // Product management
    products: router({
      list: adminProcedure.query(async () => {
        // Get all products including inactive ones
        const allDb = await db.getDb();
        if (!allDb) return [];
        
        const { products } = await import("../drizzle/schema");
        return allDb.select().from(products);
      }),
      
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          price: z.number().min(0),
          categoryId: z.number(),
          stockQuantity: z.number().min(0).default(0),
          imageUrl: z.string().optional(),
          featured: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
          await db.createProduct({
            ...input,
            active: true,
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
          categoryId: z.number().optional(),
          stockQuantity: z.number().min(0).optional(),
          imageUrl: z.string().optional(),
          featured: z.boolean().optional(),
          active: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateProduct(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteProduct(input.id);
          return { success: true };
        }),
      
      uploadImage: adminProcedure
        .input(z.object({
          productId: z.number(),
          imageData: z.string(), // base64 encoded
          fileName: z.string(),
          mimeType: z.string(),
        }))
        .mutation(async ({ input }) => {
          // Decode base64
          const buffer = Buffer.from(input.imageData, 'base64');
          
          // Generate unique file key
          const fileKey = `products/${input.productId}/${nanoid()}-${input.fileName}`;
          
          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          
          // Save to database
          await db.addProductImage({
            productId: input.productId,
            imageUrl: url,
            fileKey,
            sortOrder: 0,
          });
          
          return { url, fileKey };
        }),
    }),
    
    // Order management
    orders: router({
      list: adminProcedure.query(async () => {
        const orders = await db.getAllOrders();
        
        // Get user info for each order
        const ordersWithUsers = await Promise.all(
          orders.map(async (order) => {
            const user = await db.getUserById(order.userId);
            return {
              ...order,
              user,
            };
          })
        );
        
        return ordersWithUsers;
      }),
      
      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        }))
        .mutation(async ({ input }) => {
          await db.updateOrderStatus(input.id, input.status);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
