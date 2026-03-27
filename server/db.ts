import { eq, and, or, desc, asc, like, sql, gte, lte, count, sum, ne, isNull, isNotNull, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  categories, InsertCategory,
  products, InsertProduct,
  productImages, InsertProductImage,
  cartItems, InsertCartItem,
  orders, InsertOrder,
  orderItems, InsertOrderItem,
  orderStatusHistory, InsertOrderStatusHistory,
  promotions, InsertPromotion,
  shippingZones, InsertShippingZone,
  activityLog, InsertActivityLog,
  emailTemplates, InsertEmailTemplate,
  emailQueue, InsertEmailQueueItem,
  messageLog, InsertMessageLogEntry,
  campaigns, InsertCampaign,
  bannerSlides, InsertBannerSlide,
  contentBlocks, InsertContentBlock,
  staticPages, InsertStaticPage,
  navigationItems, InsertNavigationItem,
  mediaLibrary, InsertMediaLibraryItem,
  seoMeta, InsertSeoMeta,
  redirects, InsertRedirect,
  siteSettings, InsertSiteSetting,
  customerTags, customerTagAssignments,
  refunds, InsertRefund,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Operations ============

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Upsert user — supports both openId-based (Manus OAuth) and email-based (Google/Facebook/email) upsert
 */
export async function upsertUser(user: Partial<InsertUser> & { email: string }): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists by email first, then by openId
    let existingUser = await getUserByEmail(user.email);
    if (!existingUser && user.openId) {
      existingUser = await getUserByOpenId(user.openId);
    }

    if (existingUser) {
      // Update existing user
      const updateSet: Record<string, unknown> = {};
      
      if (user.name !== undefined) updateSet.name = user.name;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
      if (user.authProvider !== undefined) updateSet.authProvider = user.authProvider;
      if (user.googleId !== undefined) updateSet.googleId = user.googleId;
      if (user.facebookId !== undefined) updateSet.facebookId = user.facebookId;
      if (user.avatarUrl !== undefined) updateSet.avatarUrl = user.avatarUrl;
      if (user.emailVerified !== undefined) updateSet.emailVerified = user.emailVerified;
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.openId !== undefined && !existingUser.openId) updateSet.openId = user.openId;
      if (user.role !== undefined) updateSet.role = user.role;
      
      // Auto-promote owner
      if (user.openId === ENV.ownerOpenId && existingUser.role !== 'admin') {
        updateSet.role = 'admin';
      }

      updateSet.lastSignedIn = user.lastSignedIn || new Date();

      await db.update(users).set(updateSet).where(eq(users.id, existingUser.id));
      return;
    }

    // Create new user
    const values: InsertUser = {
      openId: user.openId || null,
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized as any;
      updateSet[field] = normalized;
    };

    if (user.email !== undefined) {
      const emailValue = user.email || `user_${Date.now()}@fake.local`;
      values.email = emailValue;
      updateSet.email = emailValue;
    }

    // Social auth fields
    if (user.authProvider !== undefined) { values.authProvider = user.authProvider as any; updateSet.authProvider = user.authProvider; }
    if (user.googleId !== undefined) { values.googleId = user.googleId; updateSet.googleId = user.googleId; }
    if (user.facebookId !== undefined) { values.facebookId = user.facebookId; updateSet.facebookId = user.facebookId; }
    if (user.avatarUrl !== undefined) { values.avatarUrl = user.avatarUrl; updateSet.avatarUrl = user.avatarUrl; }
    if (user.emailVerified !== undefined) { values.emailVerified = user.emailVerified; updateSet.emailVerified = user.emailVerified; }

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(filters?: { search?: string; role?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  
  const conditions: any[] = [];
  
  if (filters?.search) {
    conditions.push(
      sql`(${users.name} LIKE ${`%${filters.search}%`} OR ${users.email} LIKE ${`%${filters.search}%`})`
    );
  }
  if (filters?.role) {
    conditions.push(eq(users.role, filters.role as any));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause);
  const total = totalResult?.count || 0;
  
  const result = await db.select().from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
  
  return { users: result, total };
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set(updates).where(eq(users.id, id));
}

// ============ Category Operations ============
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(categories).values(category);
}

export async function updateCategory(id: number, updates: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(updates).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(categories).where(eq(categories.id, id));
}

// ============ Product Operations ============
export async function getAllProducts(filters?: { categoryId?: number; search?: string; featured?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(products.active, true)];
  
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.search) {
    conditions.push(
      sql`(${products.name} LIKE ${`%${filters.search}%`} OR ${products.description} LIKE ${`%${filters.search}%`})`
    );
  }
  if (filters?.featured !== undefined) {
    conditions.push(eq(products.featured, filters.featured));
  }
  
  return db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));
}

export async function getAllProductsAdmin(filters?: { search?: string; categoryId?: number; active?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  
  const conditions: any[] = [];
  
  if (filters?.search) {
    conditions.push(
      sql`(${products.name} LIKE ${`%${filters.search}%`} OR ${products.sku} LIKE ${`%${filters.search}%`})`
    );
  }
  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.active !== undefined) {
    conditions.push(eq(products.active, filters.active));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [totalResult] = await db.select({ count: count() }).from(products).where(whereClause);
  const total = totalResult?.count || 0;
  
  const result = await db.select().from(products)
    .where(whereClause)
    .orderBy(desc(products.updatedAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
  
  return { products: result, total };
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(product);
  return result;
}

export async function updateProduct(id: number, updates: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(updates).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set({ active: false }).where(eq(products.id, id));
}

export async function updateProductStock(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set({ stockQuantity: quantity }).where(eq(products.id, id));
}

export async function getLowStockProducts(threshold: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.active, true), lte(products.stockQuantity, threshold)))
    .orderBy(asc(products.stockQuantity));
}

export async function getOutOfStockProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.active, true), eq(products.stockQuantity, 0)));
}

// ============ Product Images Operations ============
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder));
}

export async function addProductImage(image: InsertProductImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(productImages).values(image);
}

export async function deleteProductImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(productImages).where(eq(productImages.id, id));
}

// ============ Cart Operations ============
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      size: cartItems.size,
      color: cartItems.color,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      product: products,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function addToCart(item: InsertCartItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)))
    .limit(1);
  
  if (existing.length > 0) {
    return db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + item.quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    return db.insert(cartItems).values(item);
  }
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (quantity <= 0) {
    return db.delete(cartItems).where(eq(cartItems.id, id));
  }
  return db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function removeFromCart(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function getAbandonedCarts(olderThanHours: number = 1) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  return db.select({
    userId: cartItems.userId,
    itemCount: count(),
    lastUpdated: sql<Date>`MAX(${cartItems.updatedAt})`,
  })
    .from(cartItems)
    .where(lte(cartItems.updatedAt, cutoff))
    .groupBy(cartItems.userId);
}

// ============ Order Operations ============
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orders).values(order);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders(filters?: { status?: string; paymentStatus?: string; search?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  
  const conditions: any[] = [];
  
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }
  if (filters?.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus as any));
  }
  if (filters?.search) {
    conditions.push(
      sql`(${orders.orderNumber} LIKE ${`%${filters.search}%`} OR ${orders.shippingName} LIKE ${`%${filters.search}%`} OR ${orders.shippingEmail} LIKE ${`%${filters.search}%`})`
    );
  }
  if (filters?.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(orders.createdAt, filters.endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [totalResult] = await db.select({ count: count() }).from(orders).where(whereClause);
  const total = totalResult?.count || 0;
  
  const result = await db.select().from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
  
  return { orders: result, total };
}

export async function updateOrderStatus(id: number, status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "return_requested" | "returned") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function updateOrderPaymentStatus(id: number, paymentStatus: "pending" | "paid" | "failed" | "refunded") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({ paymentStatus }).where(eq(orders.id, id));
}

export async function updateOrder(id: number, updates: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set(updates).where(eq(orders.id, id));
}

// ============ Order Items Operations ============
export async function createOrderItem(item: InsertOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orderItems).values(item);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============ Order Status History ============
export async function addOrderStatusHistory(entry: InsertOrderStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orderStatusHistory).values(entry);
}

export async function getOrderStatusHistory(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.createdAt));
}

// ============ Dashboard Analytics ============
export async function getDashboardStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const dateConditions: any[] = [];
  if (startDate) dateConditions.push(gte(orders.createdAt, startDate));
  if (endDate) dateConditions.push(lte(orders.createdAt, endDate));
  
  const paidCondition = eq(orders.paymentStatus, 'paid');
  const allConditions = dateConditions.length > 0 
    ? and(paidCondition, ...dateConditions) 
    : paidCondition;
  
  // Revenue & order count
  const [revenueResult] = await db.select({
    totalRevenue: sum(orders.totalAmount),
    orderCount: count(),
  }).from(orders).where(allConditions);
  
  // Total customers
  const [customerResult] = await db.select({ count: count() }).from(users).where(eq(users.role, 'user'));
  
  // Pending orders
  const [pendingResult] = await db.select({ count: count() }).from(orders).where(eq(orders.status, 'pending'));
  
  // Low stock count
  const [lowStockResult] = await db.select({ count: count() }).from(products)
    .where(and(eq(products.active, true), lte(products.stockQuantity, 10)));
  
  // Out of stock count
  const [outOfStockResult] = await db.select({ count: count() }).from(products)
    .where(and(eq(products.active, true), eq(products.stockQuantity, 0)));
  
  // Orders to ship
  const [toShipResult] = await db.select({ count: count() }).from(orders)
    .where(and(eq(orders.status, 'processing'), eq(orders.paymentStatus, 'paid')));
  
  return {
    totalRevenue: Number(revenueResult?.totalRevenue || 0),
    orderCount: revenueResult?.orderCount || 0,
    customerCount: customerResult?.count || 0,
    pendingOrders: pendingResult?.count || 0,
    lowStockCount: lowStockResult?.count || 0,
    outOfStockCount: outOfStockResult?.count || 0,
    ordersToShip: toShipResult?.count || 0,
  };
}

export async function getRevenueByDay(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return db.select({
    date: sql<string>`DATE(${orders.createdAt})`.as('date'),
    revenue: sum(orders.totalAmount),
    orderCount: count(),
  })
    .from(orders)
    .where(and(
      eq(orders.paymentStatus, 'paid'),
      gte(orders.createdAt, startDate)
    ))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);
}

export async function getTopProducts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    productId: orderItems.productId,
    productName: orderItems.productName,
    totalQuantity: sum(orderItems.quantity),
    totalRevenue: sum(orderItems.subtotal),
  })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.subtotal)))
    .limit(limit);
}

export async function getOrdersByStatus() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    status: orders.status,
    count: count(),
  })
    .from(orders)
    .groupBy(orders.status);
}

// ============ Promotions ============
export async function getAllPromotions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotions).orderBy(desc(promotions.createdAt));
}

export async function getPromotionByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promotions).where(eq(promotions.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPromotion(promo: InsertPromotion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(promotions).values(promo);
}

export async function updatePromotion(id: number, updates: Partial<InsertPromotion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(promotions).set(updates).where(eq(promotions.id, id));
}

export async function deletePromotion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(promotions).where(eq(promotions.id, id));
}

export async function incrementPromotionUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(promotions).set({ usageCount: sql`${promotions.usageCount} + 1` }).where(eq(promotions.id, id));
}

// ============ Shipping Zones ============
export async function getAllShippingZones() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingZones).orderBy(asc(shippingZones.name));
}

export async function createShippingZone(zone: InsertShippingZone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(shippingZones).values(zone);
}

export async function updateShippingZone(id: number, updates: Partial<InsertShippingZone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(shippingZones).set(updates).where(eq(shippingZones.id, id));
}

export async function deleteShippingZone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(shippingZones).where(eq(shippingZones.id, id));
}

// ============ Activity Log ============
export async function logActivity(entry: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLog).values(entry);
  } catch (err) {
    console.error("[ActivityLog] Failed to log:", err);
  }
}

export async function getActivityLog(filters?: { limit?: number; entityType?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  if (filters?.entityType) {
    conditions.push(eq(activityLog.entityType, filters.entityType));
  }
  
  return db.select().from(activityLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLog.createdAt))
    .limit(filters?.limit || 100);
}

// ============ Email Templates ============
export async function getAllEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
}

export async function getEmailTemplateByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(emailTemplates).values(template);
}

export async function updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(emailTemplates).set(updates).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

// ============ Email Queue ============
export async function queueEmail(item: InsertEmailQueueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(emailQueue).values(item);
}

export async function getQueuedEmails(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailQueue)
    .where(and(
      eq(emailQueue.status, 'queued'),
      lte(emailQueue.scheduledAt, new Date())
    ))
    .orderBy(asc(emailQueue.priority), asc(emailQueue.scheduledAt))
    .limit(limit);
}

export async function updateEmailQueueStatus(id: number, status: "queued" | "sending" | "sent" | "failed", error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: any = { status, attempts: sql`${emailQueue.attempts} + 1` };
  if (status === 'sent') updates.sentAt = new Date();
  if (error) updates.error = error;
  return db.update(emailQueue).set(updates).where(eq(emailQueue.id, id));
}

// ============ Message Log ============
export async function logMessage(entry: InsertMessageLogEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(messageLog).values(entry);
}

export async function getMessageLog(filters?: { channel?: string; campaignId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  if (filters?.channel) conditions.push(eq(messageLog.channel, filters.channel as any));
  if (filters?.campaignId) conditions.push(eq(messageLog.campaignId, filters.campaignId));
  
  return db.select().from(messageLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(messageLog.createdAt))
    .limit(filters?.limit || 100);
}

// ============ Campaigns ============
export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(campaigns).values(campaign);
}

export async function updateCampaign(id: number, updates: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

// ============ Banner Slides ============
export async function getActiveBannerSlides() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(bannerSlides)
    .where(eq(bannerSlides.active, true))
    .orderBy(asc(bannerSlides.sortOrder));
}

export async function getAllBannerSlides() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bannerSlides).orderBy(asc(bannerSlides.sortOrder));
}

export async function createBannerSlide(slide: InsertBannerSlide) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(bannerSlides).values(slide);
}

export async function updateBannerSlide(id: number, updates: Partial<InsertBannerSlide>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(bannerSlides).set(updates).where(eq(bannerSlides.id, id));
}

export async function deleteBannerSlide(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(bannerSlides).where(eq(bannerSlides.id, id));
}

// ============ Content Blocks ============
export async function getContentBlocks(pageKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentBlocks)
    .where(and(eq(contentBlocks.pageKey, pageKey), eq(contentBlocks.active, true)))
    .orderBy(asc(contentBlocks.sortOrder));
}

export async function getAllContentBlocks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentBlocks).orderBy(asc(contentBlocks.pageKey), asc(contentBlocks.sortOrder));
}

export async function createContentBlock(block: InsertContentBlock) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contentBlocks).values(block);
}

export async function updateContentBlock(id: number, updates: Partial<InsertContentBlock>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contentBlocks).set(updates).where(eq(contentBlocks.id, id));
}

export async function deleteContentBlock(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(contentBlocks).where(eq(contentBlocks.id, id));
}

// ============ Static Pages ============
export async function getStaticPageByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staticPages).where(eq(staticPages.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStaticPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staticPages).orderBy(asc(staticPages.title));
}

export async function createStaticPage(page: InsertStaticPage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(staticPages).values(page);
}

export async function updateStaticPage(id: number, updates: Partial<InsertStaticPage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(staticPages).set(updates).where(eq(staticPages.id, id));
}

export async function deleteStaticPage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(staticPages).where(eq(staticPages.id, id));
}

// ============ Navigation Items ============
export async function getNavigationItems(location?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(navigationItems.active, true)];
  if (location) conditions.push(eq(navigationItems.location, location as any));
  
  return db.select().from(navigationItems)
    .where(and(...conditions))
    .orderBy(asc(navigationItems.sortOrder));
}

export async function getAllNavigationItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(navigationItems).orderBy(asc(navigationItems.location), asc(navigationItems.sortOrder));
}

export async function createNavigationItem(item: InsertNavigationItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(navigationItems).values(item);
}

export async function updateNavigationItem(id: number, updates: Partial<InsertNavigationItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(navigationItems).set(updates).where(eq(navigationItems.id, id));
}

export async function deleteNavigationItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(navigationItems).where(eq(navigationItems.id, id));
}

// ============ Media Library ============
export async function getAllMedia(filters?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { media: [], total: 0 };
  
  const [totalResult] = await db.select({ count: count() }).from(mediaLibrary);
  const total = totalResult?.count || 0;
  
  const result = await db.select().from(mediaLibrary)
    .orderBy(desc(mediaLibrary.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
  
  return { media: result, total };
}

export async function createMediaItem(item: InsertMediaLibraryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(mediaLibrary).values(item);
}

export async function deleteMediaItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
}

// ============ SEO Meta ============
export async function getSeoMeta(pageType: string, entityId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const conditions = [eq(seoMeta.pageType, pageType as any)];
  if (entityId) {
    conditions.push(eq(seoMeta.entityId, entityId));
  } else {
    conditions.push(isNull(seoMeta.entityId));
  }
  
  const result = await db.select().from(seoMeta).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSeoMeta() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoMeta).orderBy(asc(seoMeta.pageType));
}

export async function upsertSeoMeta(meta: InsertSeoMeta) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if exists
  const existing = await getSeoMeta(meta.pageType, meta.entityId ?? undefined);
  if (existing) {
    return db.update(seoMeta).set(meta).where(eq(seoMeta.id, existing.id));
  }
  return db.insert(seoMeta).values(meta);
}

// ============ Redirects ============
export async function getAllRedirects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(redirects).orderBy(desc(redirects.createdAt));
}

export async function getRedirectByPath(fromPath: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(redirects)
    .where(and(eq(redirects.fromPath, fromPath), eq(redirects.active, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRedirect(redirect: InsertRedirect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(redirects).values(redirect);
}

export async function updateRedirect(id: number, updates: Partial<InsertRedirect>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(redirects).set(updates).where(eq(redirects.id, id));
}

export async function deleteRedirect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(redirects).where(eq(redirects.id, id));
}

// ============ Site Settings ============
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result.length > 0 ? result[0]?.value : undefined;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings);
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSetting(key);
  if (existing !== undefined) {
    return db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
  }
  return db.insert(siteSettings).values({ key, value });
}


// ============ CSV Export Helpers ============

/**
 * Get all products for CSV export (no pagination, includes category name)
 */
export async function getAllProductsForExport() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
    price: products.price,
    compareAtPrice: products.compareAtPrice,
    sku: products.sku,
    weight: products.weight,
    categoryId: products.categoryId,
    categoryName: categories.name,
    stockQuantity: products.stockQuantity,
    imageUrl: products.imageUrl,
    productType: products.productType,
    featured: products.featured,
    active: products.active,
    metaTitle: products.metaTitle,
    metaDescription: products.metaDescription,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.updatedAt));
  
  return result;
}

/**
 * Get all orders for CSV export (no pagination, includes customer email and line items summary)
 */
export async function getAllOrdersForExport(filters?: { status?: string; paymentStatus?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }
  if (filters?.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(orders.createdAt, filters.endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const result = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    totalAmount: orders.totalAmount,
    shippingCost: orders.shippingCost,
    shippingName: orders.shippingName,
    shippingEmail: orders.shippingEmail,
    shippingPhone: orders.shippingPhone,
    shippingAddress: orders.shippingAddress,
    shippingCity: orders.shippingCity,
    shippingState: orders.shippingState,
    shippingPostalCode: orders.shippingPostalCode,
    shippingCountry: orders.shippingCountry,
    shippingMethod: orders.shippingMethod,
    trackingNumber: orders.trackingNumber,
    trackingUrl: orders.trackingUrl,
    paymentIntentId: orders.paymentIntentId,
    refundedAmount: orders.refundedAmount,
    notes: orders.notes,
    customerEmail: users.email,
    customerName: users.name,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
  })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt));
  
  // Enrich with order items summary
  const enriched = await Promise.all(
    result.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsSummary = items.map(i => `${i.productName} x${i.quantity} (${i.size}/${i.color})`).join('; ');
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...order, itemsSummary, itemCount };
    })
  );
  
  return enriched;
}


/**
 * Get all customers for CSV export with tags, lifetime value, and marketing consent
 */
export async function getAllCustomersForExport() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    role: users.role,
    customerGroup: users.customerGroup,
    lifetimeValue: users.lifetimeValue,
    totalOrders: users.totalOrders,
    averageOrderValue: users.averageOrderValue,
    firstPurchaseDate: users.firstPurchaseDate,
    lastPurchaseDate: users.lastPurchaseDate,
    addressLine1: users.addressLine1,
    addressLine2: users.addressLine2,
    city: users.city,
    state: users.state,
    postalCode: users.postalCode,
    country: users.country,
    marketingConsent: users.marketingConsent,
    consentDate: users.consentDate,
    emailOptIn: users.emailOptIn,
    smsOptIn: users.smsOptIn,
    whatsappOptIn: users.whatsappOptIn,
    messengerOptIn: users.messengerOptIn,
    referralSource: users.referralSource,
    utmSource: users.utmSource,
    utmMedium: users.utmMedium,
    utmCampaign: users.utmCampaign,
    profileCompleted: users.profileCompleted,
    authProvider: users.authProvider,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  })
    .from(users)
    .orderBy(desc(users.createdAt));
  
  // Enrich with tags
  const enriched = await Promise.all(
    result.map(async (user) => {
      const tagAssignments = await db.select({
        tagName: customerTags.name,
      })
        .from(customerTagAssignments)
        .innerJoin(customerTags, eq(customerTagAssignments.tagId, customerTags.id))
        .where(eq(customerTagAssignments.userId, user.id));
      
      const tags = tagAssignments.map(t => t.tagName).join(', ');
      return { ...user, tags };
    })
  );
  
  return enriched;
}

/**
 * Get analytics/sales report data for CSV export
 */
export async function getSalesReportForExport(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { dailyRevenue: [], topProducts: [], summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 } };
  
  const conditions: any[] = [eq(orders.paymentStatus, 'paid')];
  if (startDate) conditions.push(gte(orders.createdAt, startDate));
  if (endDate) conditions.push(lte(orders.createdAt, endDate));
  
  const whereClause = and(...conditions);
  
  // Daily revenue breakdown using raw SQL to avoid GROUP BY issues
  const dailyRevenue = await db.execute(
    sql`SELECT DATE(createdAt) as date, SUM(totalAmount) as revenue, COUNT(*) as orderCount, ROUND(AVG(totalAmount)) as avgOrderValue FROM orders WHERE ${whereClause} GROUP BY DATE(createdAt) ORDER BY DATE(createdAt)`
  ) as any;
  const dailyRevenueRows = (dailyRevenue[0] || []) as Array<{ date: string; revenue: string; orderCount: number; avgOrderValue: string }>;
  
  // Top products for the period
  const orderConditions: any[] = [];
  if (startDate || endDate) {
    // Get order IDs within date range
    const orderIdsResult = await db.select({ id: orders.id })
      .from(orders)
      .where(whereClause);
    const orderIds = orderIdsResult.map(o => o.id);
    if (orderIds.length > 0) {
      orderConditions.push(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);
    }
  }
  
  const topProducts = await db.select({
    productId: orderItems.productId,
    productName: orderItems.productName,
    totalQuantity: sum(orderItems.quantity),
    totalRevenue: sum(orderItems.subtotal),
    orderCount: count(),
  })
    .from(orderItems)
    .where(orderConditions.length > 0 ? and(...orderConditions) : undefined)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.subtotal)))
    .limit(50);
  
  // Summary totals
  const [summaryResult] = await db.select({
    totalRevenue: sum(orders.totalAmount),
    totalOrders: count(),
    avgOrderValue: sql<string>`ROUND(AVG(${orders.totalAmount}))`,
  })
    .from(orders)
    .where(whereClause);
  
  return {
    dailyRevenue: dailyRevenueRows,
    topProducts,
    summary: {
      totalRevenue: Number(summaryResult?.totalRevenue || 0),
      totalOrders: summaryResult?.totalOrders || 0,
      avgOrderValue: Number(summaryResult?.avgOrderValue || 0),
    },
  };
}


// ============================================
// WISHLIST HELPERS
// ============================================

export async function getWishlistByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { wishlists, products: productsTable, productImages: productImagesTable } = await import('../drizzle/schema');
  const items = await db.select()
    .from(wishlists)
    .innerJoin(productsTable, eq(wishlists.productId, productsTable.id))
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.createdAt));
  
  const productIds = items.map(i => i.products.id);
  let images: any[] = [];
  if (productIds.length > 0) {
    images = await db.select().from(productImagesTable).where(inArray(productImagesTable.productId, productIds));
  }
  
  return items.map(item => ({
    id: item.wishlists.id,
    productId: item.products.id,
    product: {
      ...item.products,
      images: images.filter(img => img.productId === item.products.id),
    },
    createdAt: item.wishlists.createdAt,
  }));
}

export async function getWishlistProductIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { wishlists } = await import('../drizzle/schema');
  const items = await db.select({ productId: wishlists.productId })
    .from(wishlists)
    .where(eq(wishlists.userId, userId));
  return items.map(i => i.productId);
}

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { wishlists } = await import('../drizzle/schema');
  const existing = await db.select().from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
  if (existing.length > 0) return { alreadyExists: true };
  await db.insert(wishlists).values({ userId, productId });
  return { alreadyExists: false };
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { wishlists } = await import('../drizzle/schema');
  await db.delete(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
}

export async function getWishlistCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const { wishlists } = await import('../drizzle/schema');
  const [result] = await db.select({ count: count() })
    .from(wishlists)
    .where(eq(wishlists.userId, userId));
  return result?.count || 0;
}

// ============================================
// PROMO CODE USAGE HELPERS
// ============================================

export async function getPromoUsageByUser(promotionId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const { promoCodeUsages } = await import('../drizzle/schema');
  const [result] = await db.select({ count: count() }).from(promoCodeUsages)
    .where(and(eq(promoCodeUsages.promotionId, promotionId), eq(promoCodeUsages.userId, userId)));
  return result?.count || 0;
}

export async function recordPromoUsage(promotionId: number, userId: number, orderId: number, discountAmount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { promoCodeUsages, promotions: promosTable } = await import('../drizzle/schema');
  await db.insert(promoCodeUsages).values({ promotionId, userId, orderId, discountAmount });
  await db.update(promosTable)
    .set({ usageCount: sql`${promosTable.usageCount} + 1` })
    .where(eq(promosTable.id, promotionId));
}


// ============ Refund Operations ============

export async function createRefundRecord(data: InsertRefund) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(refunds).values(data);
}

export async function getRefundsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(refunds).where(eq(refunds.orderId, orderId)).orderBy(desc(refunds.createdAt));
}

export async function getRefundHistory(params?: {
  search?: string;
  refundType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { refunds: [], total: 0 };

  const conditions = [];
  if (params?.search) {
    conditions.push(
      or(
        like(refunds.orderNumber, `%${params.search}%`),
        like(refunds.stripeRefundId, `%${params.search}%`),
        like(refunds.customerEmail, `%${params.search}%`),
        like(refunds.customerName, `%${params.search}%`)
      )
    );
  }
  if (params?.refundType && params.refundType !== 'all') {
    conditions.push(eq(refunds.refundType, params.refundType as any));
  }
  if (params?.status && params.status !== 'all') {
    conditions.push(eq(refunds.status, params.status as any));
  }
  if (params?.startDate) {
    conditions.push(gte(refunds.createdAt, new Date(params.startDate)));
  }
  if (params?.endDate) {
    conditions.push(lte(refunds.createdAt, new Date(params.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  const rows = await db.select().from(refunds)
    .where(whereClause)
    .orderBy(desc(refunds.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db.select({ count: count() }).from(refunds).where(whereClause);

  return { refunds: rows, total: countResult?.count || 0 };
}

export async function getRefundStats(startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return { totalRefunded: 0, refundCount: 0, fullRefunds: 0, partialRefunds: 0, failedRefunds: 0, avgRefundAmount: 0 };

  const conditions = [];
  if (startDate) conditions.push(gte(refunds.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(refunds.createdAt, new Date(endDate)));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totals] = await db.select({
    totalRefunded: sql<number>`COALESCE(SUM(CASE WHEN ${refunds.status} = 'succeeded' THEN ${refunds.refundAmount} ELSE 0 END), 0)`,
    refundCount: count(),
    avgRefundAmount: sql<number>`COALESCE(AVG(CASE WHEN ${refunds.status} = 'succeeded' THEN ${refunds.refundAmount} ELSE NULL END), 0)`,
  }).from(refunds).where(whereClause);

  const [fullCount] = await db.select({ count: count() }).from(refunds)
    .where(whereClause ? and(whereClause, eq(refunds.refundType, 'full')) : eq(refunds.refundType, 'full'));
  const [partialCount] = await db.select({ count: count() }).from(refunds)
    .where(whereClause ? and(whereClause, eq(refunds.refundType, 'partial')) : eq(refunds.refundType, 'partial'));
  const [failedCount] = await db.select({ count: count() }).from(refunds)
    .where(whereClause ? and(whereClause, eq(refunds.status, 'failed')) : eq(refunds.status, 'failed'));

  return {
    totalRefunded: Number(totals?.totalRefunded) || 0,
    refundCount: Number(totals?.refundCount) || 0,
    fullRefunds: Number(fullCount?.count) || 0,
    partialRefunds: Number(partialCount?.count) || 0,
    failedRefunds: Number(failedCount?.count) || 0,
    avgRefundAmount: Math.round(Number(totals?.avgRefundAmount) || 0),
  };
}

export async function getAllRefundsForExport(params?: {
  startDate?: string;
  endDate?: string;
  refundType?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params?.startDate) conditions.push(gte(refunds.createdAt, new Date(params.startDate)));
  if (params?.endDate) conditions.push(lte(refunds.createdAt, new Date(params.endDate)));
  if (params?.refundType && params.refundType !== 'all') {
    conditions.push(eq(refunds.refundType, params.refundType as any));
  }
  if (params?.status && params.status !== 'all') {
    conditions.push(eq(refunds.status, params.status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(refunds)
    .where(whereClause)
    .orderBy(desc(refunds.createdAt));
}

export async function getRefundTrends(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let dateFormat: string;
  switch (period) {
    case 'daily':
      dateFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      dateFormat = '%x-%v'; // ISO year-week
      break;
    case 'monthly':
      dateFormat = '%Y-%m';
      break;
  }

  // Use raw SQL to avoid Drizzle's column reference issue with only_full_group_by
  const rows = await db.execute(sql`
    SELECT
      DATE_FORMAT(\`createdAt\`, ${dateFormat}) AS \`period\`,
      COUNT(*) AS \`refundCount\`,
      COALESCE(SUM(\`refundAmount\`), 0) AS \`totalAmount\`,
      SUM(CASE WHEN \`refundType\` = 'full' THEN 1 ELSE 0 END) AS \`fullCount\`,
      SUM(CASE WHEN \`refundType\` = 'partial' THEN 1 ELSE 0 END) AS \`partialCount\`,
      SUM(CASE WHEN \`status\` = 'succeeded' THEN 1 ELSE 0 END) AS \`succeededCount\`,
      SUM(CASE WHEN \`status\` = 'failed' THEN 1 ELSE 0 END) AS \`failedCount\`
    FROM \`refunds\`
    WHERE \`createdAt\` >= ${startDate}
    GROUP BY DATE_FORMAT(\`createdAt\`, ${dateFormat})
    ORDER BY DATE_FORMAT(\`createdAt\`, ${dateFormat})
  `);

  const data = (rows as any)[0] || rows;
  const resultRows = Array.isArray(data) ? data : [];

  return resultRows.map((r: any) => ({
    period: String(r.period || ''),
    refundCount: Number(r.refundCount) || 0,
    totalAmount: Number(r.totalAmount) || 0,
    fullCount: Number(r.fullCount) || 0,
    partialCount: Number(r.partialCount) || 0,
    succeededCount: Number(r.succeededCount) || 0,
    failedCount: Number(r.failedCount) || 0,
  }));
}
