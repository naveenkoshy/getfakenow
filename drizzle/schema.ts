import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Made optional for email/password auth
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Auth provider tracking
  loginMethod: varchar("loginMethod", { length: 64 }).default("email").notNull(),
  authProvider: mysqlEnum("authProvider", ["manus", "google", "facebook", "email"]).default("email").notNull(),
  googleId: varchar("googleId", { length: 255 }),
  facebookId: varchar("facebookId", { length: 255 }),
  avatarUrl: text("avatarUrl"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Profile completion
  profileCompleted: boolean("profileCompleted").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(0).notNull(), // 0=not started, 1=basic, 2=address, 3=consent, 4=done
  // Address fields
  addressLine1: varchar("addressLine1", { length: 500 }),
  addressLine2: varchar("addressLine2", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Malaysia"),
  addressVerified: boolean("addressVerified").default(false).notNull(),
  // Email & verification
  emailVerified: boolean("emailVerified").default(false).notNull(),
  // Marketing consent
  marketingConsent: boolean("marketingConsent").default(false).notNull(),
  consentDate: timestamp("consentDate"),
  emailOptIn: boolean("emailOptIn").default(false).notNull(),
  smsOptIn: boolean("smsOptIn").default(false).notNull(),
  whatsappOptIn: boolean("whatsappOptIn").default(false).notNull(),
  messengerOptIn: boolean("messengerOptIn").default(false).notNull(),
  messengerPsid: varchar("messengerPsid", { length: 255 }),
  // Customer segmentation
  customerGroup: varchar("customerGroup", { length: 50 }).default("new"), // new, returning, vip, wholesale
  lifetimeValue: int("lifetimeValue").default(0).notNull(), // Total spent in sen
  totalOrders: int("totalOrders").default(0).notNull(),
  averageOrderValue: int("averageOrderValue").default(0).notNull(), // In sen
  firstPurchaseDate: timestamp("firstPurchaseDate"),
  lastPurchaseDate: timestamp("lastPurchaseDate"),
  // Email verification
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationExpiry: timestamp("emailVerificationExpiry"),
  // Password reset
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  // Referral tracking
  referralSource: varchar("referralSource", { length: 100 }), // google, facebook, instagram, friend, etc.
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Customer tags for segmentation and marketing
 */
export const customerTags = mysqlTable("customerTags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 20 }).default("#6B7280").notNull(), // Hex color for UI badges
  description: text("description"),
  autoAssign: boolean("autoAssign").default(false).notNull(), // Auto-assign based on rules
  autoAssignRule: text("autoAssignRule"), // JSON rule definition
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerTag = typeof customerTags.$inferSelect;
export type InsertCustomerTag = typeof customerTags.$inferInsert;

/**
 * Customer-tag assignments (many-to-many)
 */
export const customerTagAssignments = mysqlTable("customerTagAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tagId: int("tagId").notNull(),
  assignedBy: int("assignedBy"), // Admin who assigned (null = auto-assigned)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerTagAssignment = typeof customerTagAssignments.$inferSelect;
export type InsertCustomerTagAssignment = typeof customerTagAssignments.$inferInsert;

/**
 * Customer events - behavioral tracking for marketing
 */
export const customerEvents = mysqlTable("customerEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 255 }),
  eventType: varchar("eventType", { length: 50 }).notNull(), // page_view, product_view, add_to_cart, purchase, wishlist, search
  entityType: varchar("entityType", { length: 50 }), // product, category, page
  entityId: int("entityId"),
  metadata: text("metadata"), // JSON: search query, referrer, device, etc.
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerEvent = typeof customerEvents.$inferSelect;
export type InsertCustomerEvent = typeof customerEvents.$inferInsert;

/**
 * Product categories for organizing the catalog
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products table with inventory tracking
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: int("price").notNull(), // Price in cents to avoid decimal issues
  compareAtPrice: int("compareAtPrice"), // Original price for "was/now" display (sen)
  sku: varchar("sku", { length: 100 }), // Stock Keeping Unit
  weight: int("weight"), // Weight in grams (for shipping calc)
  categoryId: int("categoryId").notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  imageUrl: text("imageUrl"),
  productType: mysqlEnum("productType", ["physical", "digital", "bundle"]).default("physical").notNull(),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Additional product images stored in S3
 */
export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  color: varchar("color", { length: 20 }), // Color variant: black, white, navy, red, or null for default
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

/**
 * Shopping cart items
 */
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  size: varchar("size", { length: 10 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"]).default("pending").notNull(),
  totalAmount: int("totalAmount").notNull(), // Total in cents
  shippingCost: int("shippingCost").default(0).notNull(), // Shipping fee in sen
  // Shipping details
  shippingName: varchar("shippingName", { length: 255 }).notNull(),
  shippingEmail: varchar("shippingEmail", { length: 320 }).notNull(),
  shippingPhone: varchar("shippingPhone", { length: 50 }).notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  shippingCity: varchar("shippingCity", { length: 100 }).notNull(),
  shippingState: varchar("shippingState", { length: 100 }).notNull(),
  shippingPostalCode: varchar("shippingPostalCode", { length: 20 }).notNull(),
  shippingCountry: varchar("shippingCountry", { length: 100 }).notNull().default("Malaysia"),
  shippingMethod: varchar("shippingMethod", { length: 50 }).default("standard"),
  // Tracking
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  trackingUrl: text("trackingUrl"),
  // Payment
  paymentIntentId: varchar("paymentIntentId", { length: 255 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  refundedAmount: int("refundedAmount").default(0).notNull(), // Partial/full refund amount (sen)
  // Admin
  notes: text("notes"), // Internal admin notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items - products in each order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productPrice: int("productPrice").notNull(),
  quantity: int("quantity").notNull(),
  size: varchar("size", { length: 10 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  subtotal: int("subtotal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Order status history - audit trail for order changes
 */
export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }).notNull(),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: int("changedBy").notNull(), // FK to users (admin who made the change)
  note: text("note"), // Optional note (e.g., tracking number, reason)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

/**
 * Promotions & discount codes
 */
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed", "free_shipping"]).notNull(),
  value: int("value").notNull(), // Percentage or sen amount
  minOrderAmount: int("minOrderAmount"), // Minimum order to qualify (sen)
  maxUsage: int("maxUsage"), // Total redemption limit (null = unlimited)
  usageCount: int("usageCount").default(0).notNull(),
  perCustomerLimit: int("perCustomerLimit"), // Per-customer limit
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

/**
 * Shipping zones configuration
 */
export const shippingZones = mysqlTable("shippingZones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  states: text("states"), // Comma-separated state codes
  flatRate: int("flatRate").notNull(), // Shipping cost in sen
  freeShippingThreshold: int("freeShippingThreshold"), // Free shipping above this amount (sen)
  estimatedDays: varchar("estimatedDays", { length: 50 }),
  active: boolean("active").default(true).notNull(),
});

export type ShippingZone = typeof shippingZones.$inferSelect;
export type InsertShippingZone = typeof shippingZones.$inferInsert;

/**
 * Admin invites - secure invite tokens for new admin users
 */
export const adminInvites = mysqlTable("adminInvites", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(), // FK to users (admin who sent invite)
  role: mysqlEnum("role", ["admin"]).default("admin").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminInvite = typeof adminInvites.$inferSelect;
export type InsertAdminInvite = typeof adminInvites.$inferInsert;

/**
 * Activity log - admin action audit trail
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users (admin)
  action: varchar("action", { length: 100 }).notNull(), // e.g., admin.login, order.status.update
  entityType: varchar("entityType", { length: 50 }).notNull(), // product, order, user, session, invite
  entityId: int("entityId"), // Entity ID
  details: text("details"), // JSON payload of changes
  ipAddress: varchar("ipAddress", { length: 45 }), // Client IP for security audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// ============================================
// EMAIL & MESSAGING TABLES
// ============================================

/**
 * Email templates - admin-editable email content
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlBody: text("htmlBody").notNull(),
  textBody: text("textBody"),
  category: mysqlEnum("category", ["transactional", "marketing", "system"]).default("transactional").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email queue - async send with retry logic
 */
export const emailQueue = mysqlTable("emailQueue", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientId: int("recipientId"),
  templateKey: varchar("templateKey", { length: 100 }).notNull(),
  variables: text("variables"), // JSON object of template variables
  priority: mysqlEnum("priority", ["high", "normal", "low"]).default("normal").notNull(),
  status: mysqlEnum("status", ["queued", "sending", "sent", "failed"]).default("queued").notNull(),
  attempts: int("attempts").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailQueueItem = typeof emailQueue.$inferSelect;
export type InsertEmailQueueItem = typeof emailQueue.$inferInsert;

/**
 * Unified message log - all outbound messages across all channels
 */
export const messageLog = mysqlTable("messageLog", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "messenger"]).notNull(),
  recipientId: int("recipientId"),
  recipientContact: varchar("recipientContact", { length: 320 }).notNull(),
  templateKey: varchar("templateKey", { length: 100 }),
  subject: varchar("subject", { length: 500 }),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "read", "failed", "bounced"]).default("queued").notNull(),
  campaignId: int("campaignId"),
  metadata: text("metadata"), // JSON (provider message ID, error details)
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageLogEntry = typeof messageLog.$inferSelect;
export type InsertMessageLogEntry = typeof messageLog.$inferInsert;

/**
 * Broadcast campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  channels: varchar("channels", { length: 100 }).notNull(), // Comma-separated: email,whatsapp,messenger
  audienceSegment: varchar("audienceSegment", { length: 100 }).notNull(),
  emailTemplateId: int("emailTemplateId"),
  whatsappTemplateKey: varchar("whatsappTemplateKey", { length: 100 }),
  messengerContent: text("messengerContent"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "cancelled"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  recipientCount: int("recipientCount").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  openedCount: int("openedCount").default(0).notNull(),
  clickedCount: int("clickedCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ============================================
// CMS TABLES
// ============================================

/**
 * Banner slides - homepage hero carousel
 */
export const bannerSlides = mysqlTable("bannerSlides", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("imageUrl").notNull(),
  mobileImageUrl: text("mobileImageUrl"),
  ctaText: varchar("ctaText", { length: 100 }),
  ctaLink: varchar("ctaLink", { length: 500 }),
  textColor: varchar("textColor", { length: 20 }).default("#FFFFFF"),
  overlayOpacity: int("overlayOpacity").default(40).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BannerSlide = typeof bannerSlides.$inferSelect;
export type InsertBannerSlide = typeof bannerSlides.$inferInsert;

/**
 * Content blocks - modular page sections
 */
export const contentBlocks = mysqlTable("contentBlocks", {
  id: int("id").autoincrement().primaryKey(),
  pageKey: varchar("pageKey", { length: 100 }).notNull(),
  blockType: varchar("blockType", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(), // JSON payload specific to block type
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type InsertContentBlock = typeof contentBlocks.$inferInsert;

/**
 * Static pages - admin-editable content pages
 */
export const staticPages = mysqlTable("staticPages", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  published: boolean("published").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaticPage = typeof staticPages.$inferSelect;
export type InsertStaticPage = typeof staticPages.$inferInsert;

/**
 * Navigation items - header/footer link management
 */
export const navigationItems = mysqlTable("navigationItems", {
  id: int("id").autoincrement().primaryKey(),
  location: mysqlEnum("location", ["header", "footer", "mobile"]).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  parentId: int("parentId"),
  active: boolean("active").default(true).notNull(),
});

export type NavigationItem = typeof navigationItems.$inferSelect;
export type InsertNavigationItem = typeof navigationItems.$inferInsert;

/**
 * Media library - centralized asset management
 */
export const mediaLibrary = mysqlTable("mediaLibrary", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: text("fileKey").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  width: int("width"),
  height: int("height"),
  altText: varchar("altText", { length: 500 }),
  tags: text("tags"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = typeof mediaLibrary.$inferInsert;

// ============================================
// SEO TABLES
// ============================================

/**
 * SEO meta data - per-page SEO configuration
 */
export const seoMeta = mysqlTable("seoMeta", {
  id: int("id").autoincrement().primaryKey(),
  pageType: mysqlEnum("pageType", ["product", "category", "page", "global"]).notNull(),
  entityId: int("entityId"), // FK to entity (null for global)
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  focusKeyword: varchar("focusKeyword", { length: 255 }),
  ogTitle: varchar("ogTitle", { length: 255 }),
  ogDescription: text("ogDescription"),
  ogImage: text("ogImage"),
  noIndex: boolean("noIndex").default(false).notNull(),
  canonicalUrl: varchar("canonicalUrl", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeoMeta = typeof seoMeta.$inferSelect;
export type InsertSeoMeta = typeof seoMeta.$inferInsert;

/**
 * URL redirects - 301/302 redirect management
 */
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  fromPath: varchar("fromPath", { length: 500 }).notNull().unique(),
  toPath: varchar("toPath", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["301", "302"]).default("301").notNull(),
  active: boolean("active").default(true).notNull(),
  hitCount: int("hitCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Redirect = typeof redirects.$inferSelect;
export type InsertRedirect = typeof redirects.$inferInsert;

// ============================================
// EXISTING TABLES (Digital Products, Content)
// ============================================

/**
 * Digital products (guides, PDFs, e-books)
 */
export const digitalProducts = mysqlTable("digitalProducts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: int("price").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  previewUrl: text("previewUrl"),
  fileSize: int("fileSize"),
  downloadCount: int("downloadCount").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DigitalProduct = typeof digitalProducts.$inferSelect;
export type InsertDigitalProduct = typeof digitalProducts.$inferInsert;

/**
 * Content posts (blog articles, guides)
 */
export const contentPosts = mysqlTable("contentPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  category: mysqlEnum("category", ["style", "care", "lifestyle", "guides", "news"]).default("style").notNull(),
  featuredImage: text("featuredImage"),
  featured: boolean("featured").default(false).notNull(),
  published: boolean("published").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export type ContentPost = typeof contentPosts.$inferSelect;
export type InsertContentPost = typeof contentPosts.$inferInsert;

/**
 * Order downloads - track digital product downloads
 */
export const orderDownloads = mysqlTable("orderDownloads", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  digitalProductId: int("digitalProductId").notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  lastDownloadedAt: timestamp("lastDownloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderDownload = typeof orderDownloads.$inferSelect;
export type InsertOrderDownload = typeof orderDownloads.$inferInsert;

// ============================================
// WISHLIST TABLE
// ============================================

/**
 * Wishlists - saved products for later
 */
export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = typeof wishlists.$inferInsert;

/**
 * Promo code usage tracking - per-user redemption
 */
export const promoCodeUsages = mysqlTable("promoCodeUsages", {
  id: int("id").autoincrement().primaryKey(),
  promotionId: int("promotionId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  discountAmount: int("discountAmount").notNull(), // Discount applied in sen
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCodeUsage = typeof promoCodeUsages.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsages.$inferInsert;

// ============================================
// SITE SETTINGS TABLE
// ============================================

/**
 * Site settings - key-value store for global configuration
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
