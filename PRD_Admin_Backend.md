# Product Requirements Document: Fake by Freetown — Admin Backend (Seller Center)

**Version:** 1.0
**Date:** March 26, 2026
**Author:** Manus AI
**Project:** Fake by Freetown E-Commerce Platform
**Domain:** getfakenow.com

---

## 1. Executive Summary

This document defines the complete backend administration system for Fake by Freetown, an e-commerce apparel brand operating out of Malaysia. The admin backend — referred to internally as **Seller Center** — is the operational nerve center for managing every aspect of the online store: product catalog, inventory, orders, customers, revenue, promotions, shipping, and site configuration.

The Seller Center is designed for **pure e-commerce sales operations**. It is not a social commerce tool. There are no livestream integrations, affiliate dashboards, or content-driven selling features. Every module exists to serve one goal: sell clothes, ship them, and understand the numbers.

The system is built on a **React 19 + tRPC + Express + Drizzle ORM + MySQL** stack, with Stripe as the payment processor and S3-compatible storage for media assets. Authentication uses JWT-based sessions with role-based access control (`admin` vs `user`).

---

## 2. Architecture Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui | Admin UI components and layout |
| State & Data | tRPC 11, TanStack Query | Type-safe API calls with caching |
| Server | Express 4, Node.js 22 | HTTP server, webhook handling |
| ORM | Drizzle ORM | Schema-first database access |
| Database | MySQL (TiDB) | Persistent storage |
| Payments | Stripe Checkout + Webhooks | Payment processing (MYR) |
| Storage | S3 (Manus Storage Proxy) | Product images, digital assets |
| Auth | JWT + bcrypt | Session management, password hashing |

### 2.2 Role-Based Access Control

The system enforces two roles at the database level via the `users.role` enum field:

| Role | Access Level | Description |
|------|-------------|-------------|
| `admin` | Full | Complete Seller Center access. Can manage products, orders, customers, settings, and analytics. The store owner is auto-promoted to admin via `OWNER_OPEN_ID` matching. |
| `user` | Customer | Storefront access only. Can browse, purchase, view own orders. No Seller Center access. |

All admin-only tRPC procedures are gated by `adminProcedure`, which checks `ctx.user.role === 'admin'` and throws `FORBIDDEN` if the condition fails. Additional admin users are promoted by updating the `role` field directly in the database.

### 2.3 Request Flow

```
Browser → React App → tRPC Client → /api/trpc → Express → tRPC Router
                                                              ↓
                                                    protectedProcedure / adminProcedure
                                                              ↓
                                                         db.ts helpers
                                                              ↓
                                                     Drizzle ORM → MySQL
```

Stripe webhooks follow a separate path:

```
Stripe → POST /api/stripe/webhook → express.raw() → webhookHandler.ts
                                                          ↓
                                                   stripeWebhook.ts
                                                          ↓
                                                   db.ts (update order)
```

---

## 3. Database Schema

### 3.1 Entity Relationship Summary

The database consists of 9 tables organized into four domains: **Users**, **Catalog**, **Commerce**, and **Content**. All monetary values are stored as integers in **sen** (1/100 of MYR) to avoid floating-point precision issues. All timestamps are stored in UTC.

### 3.2 Table Definitions

#### 3.2.1 `users` — Customer and Admin Accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Internal user ID |
| `openId` | VARCHAR(64) | UNIQUE, nullable | Manus OAuth identifier |
| `name` | TEXT | nullable | Display name |
| `email` | VARCHAR(320) | NOT NULL, UNIQUE | Email address (login identifier) |
| `passwordHash` | VARCHAR(255) | nullable | bcrypt hash (null for OAuth-only users) |
| `loginMethod` | VARCHAR(64) | NOT NULL, default `'email'` | `'email'` or `'oauth'` |
| `role` | ENUM(`'user'`, `'admin'`) | NOT NULL, default `'user'` | Access level |
| `emailVerified` | BOOLEAN | NOT NULL, default `false` | Email verification status |
| `resetToken` | VARCHAR(255) | nullable | Password reset token (hex) |
| `resetTokenExpiry` | TIMESTAMP | nullable | Token expiration (1 hour TTL) |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Account creation |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last modification |
| `lastSignedIn` | TIMESTAMP | NOT NULL, default `NOW()` | Last login timestamp |

**Authentication flow:** Users register with email/password (bcrypt, 10 salt rounds). Passwords must be 8+ characters with uppercase, lowercase, and a number. JWT tokens are signed with `JWT_SECRET` and set as HTTP-only cookies with 7-day (standard) or 30-day (remember me) expiry. OAuth users authenticate via Manus OAuth and are upserted on callback. The store owner (matched by `OWNER_OPEN_ID`) is automatically assigned the `admin` role.

#### 3.2.2 `categories` — Product Categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Category ID |
| `name` | VARCHAR(255) | NOT NULL | Display name (e.g., "Women") |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-safe identifier (e.g., `women`) |
| `description` | TEXT | nullable | Category description |
| `imageUrl` | TEXT | nullable | Category hero/banner image |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last modification |

**Current categories in production:**

| ID | Name | Slug | Product Count |
|----|------|------|---------------|
| 10001 | Printed Tees | printed-tees | 4 |
| 30001 | Casual | casual | 11 |
| 30002 | Professional | professional | 5 |
| 30003 | Accessories | accessories | 3 |
| 40001 | Women | women | 10 |

#### 3.2.3 `products` — Product Catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Product ID |
| `name` | VARCHAR(255) | NOT NULL | Product name (e.g., "The Dropout") |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL slug (e.g., `the-dropout`) |
| `description` | TEXT | nullable | Full description with embedded `MATERIALS:` and `CARE:` sections |
| `price` | INT | NOT NULL | Price in sen (e.g., 8900 = RM 89.00) |
| `categoryId` | INT | NOT NULL | FK to `categories.id` |
| `stockQuantity` | INT | NOT NULL, default `0` | Available inventory units |
| `imageUrl` | TEXT | nullable | Primary product image URL (S3/CDN) |
| `productType` | ENUM(`'physical'`, `'digital'`, `'bundle'`) | NOT NULL, default `'physical'` | Product classification |
| `featured` | BOOLEAN | NOT NULL, default `false` | Show on homepage featured section |
| `active` | BOOLEAN | NOT NULL, default `true` | Soft-delete flag (false = hidden) |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last modification |

**Description format convention:** Product descriptions use a structured text format with embedded sections. The main description paragraph is followed by `MATERIALS:` and `CARE:` markers that the frontend parses into separate accordion panels on the product detail page.

```
Main description paragraph here.

MATERIALS: 80% Cotton, 20% Polyester. 280gsm heavyweight french terry...

CARE: Machine wash cold with like colors. Tumble dry low. Do not bleach...
```

**Deletion strategy:** Products are soft-deleted by setting `active = false`. The `getAllProducts()` helper filters by `active = true` by default. The admin product list shows all products including inactive ones.

#### 3.2.4 `productImages` — Additional Product Images

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Image ID |
| `productId` | INT | NOT NULL | FK to `products.id` |
| `imageUrl` | TEXT | NOT NULL | S3 URL |
| `fileKey` | TEXT | NOT NULL | S3 object key for reference |
| `color` | VARCHAR(20) | nullable | Color variant (`black`, `white`, `navy`, `red`, or null) |
| `sortOrder` | INT | NOT NULL, default `0` | Display ordering |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Upload timestamp |

Images are uploaded via the admin `uploadImage` mutation, which accepts base64-encoded data, uploads to S3 via `storagePut()`, and stores the resulting URL and key in this table. The frontend queries images by `productId` and orders by `sortOrder`.

#### 3.2.5 `cartItems` — Shopping Cart

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Cart item ID |
| `userId` | INT | NOT NULL | FK to `users.id` |
| `productId` | INT | NOT NULL | FK to `products.id` |
| `quantity` | INT | NOT NULL | Number of units |
| `size` | VARCHAR(10) | NOT NULL | Selected size (S, M, L, XL, XXL) |
| `color` | VARCHAR(20) | NOT NULL | Selected color (black, white, navy, red) |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Added to cart |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last quantity change |

**Cart behavior:** Adding a product that already exists in the cart (same `userId` + `productId`) increments the quantity rather than creating a duplicate row. Setting quantity to 0 or below triggers a delete. Cart items are joined with `products` on read to provide current pricing and availability. The cart is server-side and persists across sessions.

#### 3.2.6 `orders` — Order Records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Order ID |
| `userId` | INT | NOT NULL | FK to `users.id` |
| `orderNumber` | VARCHAR(64) | NOT NULL, UNIQUE | Human-readable ID (e.g., `ORD-A3BX7KM2NP`) |
| `status` | ENUM | NOT NULL, default `'pending'` | `pending` → `processing` → `shipped` → `delivered` / `cancelled` |
| `totalAmount` | INT | NOT NULL | Order total in sen |
| `shippingName` | VARCHAR(255) | NOT NULL | Recipient full name |
| `shippingEmail` | VARCHAR(320) | NOT NULL | Recipient email |
| `shippingPhone` | VARCHAR(50) | NOT NULL | Recipient phone |
| `shippingAddress` | TEXT | NOT NULL | Street address |
| `shippingCity` | VARCHAR(100) | NOT NULL | City |
| `shippingState` | VARCHAR(100) | NOT NULL | State/province |
| `shippingPostalCode` | VARCHAR(20) | NOT NULL | Postal/ZIP code |
| `shippingCountry` | VARCHAR(100) | NOT NULL, default `'Malaysia'` | Country |
| `paymentIntentId` | VARCHAR(255) | nullable | Stripe PaymentIntent ID |
| `paymentStatus` | ENUM | NOT NULL, default `'pending'` | `pending` → `paid` / `failed` / `refunded` |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Order placed |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last status change |

**Order lifecycle:**

```
Customer places order → status: pending, paymentStatus: pending
                              ↓
Stripe Checkout Session created → customer redirected to Stripe
                              ↓
Payment succeeds → Stripe webhook (checkout.session.completed)
                              ↓
Webhook handler → status: processing, paymentStatus: paid
                  + inventory deducted for each order item
                              ↓
Admin ships order → status: shipped (manual via Seller Center)
                              ↓
Delivery confirmed → status: delivered (manual via Seller Center)
```

**Order number format:** Generated using `nanoid(10)` prefixed with `ORD-`, producing strings like `ORD-A3BX7KM2NP`. This is the customer-facing identifier used in confirmation emails and the order history page.

#### 3.2.7 `orderItems` — Line Items per Order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Line item ID |
| `orderId` | INT | NOT NULL | FK to `orders.id` |
| `productId` | INT | NOT NULL | FK to `products.id` |
| `productName` | VARCHAR(255) | NOT NULL | Snapshot of product name at purchase time |
| `productPrice` | INT | NOT NULL | Snapshot of unit price in sen at purchase time |
| `quantity` | INT | NOT NULL | Units ordered |
| `size` | VARCHAR(10) | NOT NULL | Size selected |
| `color` | VARCHAR(20) | NOT NULL | Color selected |
| `subtotal` | INT | NOT NULL | `quantity * productPrice` in sen |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Created with order |

Order items store **snapshots** of product name and price at the time of purchase. This ensures historical order records remain accurate even if the product is later renamed, repriced, or deleted.

#### 3.2.8 `digitalProducts` — Digital Goods (Future)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Digital product ID |
| `name` | VARCHAR(255) | NOT NULL | Product name |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL slug |
| `description` | TEXT | nullable | Description |
| `price` | INT | NOT NULL | Price in sen |
| `fileUrl` | TEXT | NOT NULL | S3 download URL |
| `fileKey` | TEXT | NOT NULL | S3 object key |
| `previewUrl` | TEXT | nullable | Cover/preview image |
| `fileSize` | INT | nullable | File size in bytes |
| `downloadCount` | INT | NOT NULL, default `0` | Total downloads |
| `featured` | BOOLEAN | NOT NULL, default `false` | Featured flag |
| `active` | BOOLEAN | NOT NULL, default `true` | Active flag |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Creation |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last update |

This table is provisioned for future use (e.g., lookbooks, style guides, digital gift cards). Not currently active in the storefront.

#### 3.2.9 `contentPosts` — Blog/Content (Future)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, auto-increment | Post ID |
| `title` | VARCHAR(255) | NOT NULL | Post title |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL slug |
| `excerpt` | TEXT | nullable | Short summary |
| `body` | TEXT | NOT NULL | Full content (Markdown) |
| `category` | ENUM | NOT NULL, default varies | `hacks`, `lifestyle`, `guides`, `news` |
| `featuredImage` | TEXT | nullable | Hero image URL |
| `featured` | BOOLEAN | NOT NULL, default `false` | Featured flag |
| `published` | BOOLEAN | NOT NULL, default `false` | Published flag |
| `viewCount` | INT | NOT NULL, default `0` | Page views |
| `createdAt` | TIMESTAMP | NOT NULL, default `NOW()` | Creation |
| `updatedAt` | TIMESTAMP | NOT NULL, auto-update | Last update |
| `publishedAt` | TIMESTAMP | nullable | Publication date |

Provisioned for future blog/content marketing. Not currently active.

---

## 4. Seller Center Modules

The Seller Center is the admin-only dashboard accessible at `/admin`. It uses the `DashboardLayout` component with sidebar navigation. The following sections define every module, its purpose, the data it displays, and the operations it supports.

### 4.1 Dashboard (Homepage)

**Route:** `/admin`
**Purpose:** At-a-glance operational overview. The first screen an admin sees after login.

**Key Metrics Cards (Top Row):**

| Metric | Source | Description |
|--------|--------|-------------|
| Orders to Fulfill | `orders` WHERE `status = 'processing'` AND `paymentStatus = 'paid'` | Paid orders awaiting shipment |
| Pending Returns | `orders` WHERE `status = 'cancelled'` AND `paymentStatus = 'paid'` | Orders needing refund processing |
| Low Stock | `products` WHERE `stockQuantity < 10` AND `active = true` | Products approaching stockout |
| Out of Stock | `products` WHERE `stockQuantity = 0` AND `active = true` | Products with zero inventory |
| Revenue Today | `orders` WHERE `paymentStatus = 'paid'` AND `createdAt = TODAY` | Sum of `totalAmount` for today |

**Performance Summary (Middle Section):**

| Metric | Calculation | Period |
|--------|------------|--------|
| Gross Merchandise Value (GMV) | SUM of `orders.totalAmount` WHERE `paymentStatus = 'paid'` | Last 7 / 30 / 90 days, selectable |
| Total Orders | COUNT of `orders` WHERE `paymentStatus = 'paid'` | Same period |
| Total Customers | COUNT DISTINCT `orders.userId` WHERE `paymentStatus = 'paid'` | Same period |
| Average Order Value (AOV) | GMV / Total Orders | Same period |
| Conversion Rate | Orders / Unique Visitors (from analytics) | Same period |

**Revenue Chart:** A line chart showing daily GMV over the selected period, with comparison to the previous equivalent period (e.g., last 7 days vs. prior 7 days). Percentage change indicators (green up / red down) for each metric.

**Recent Orders Table:** The 10 most recent orders with columns: Order Number, Customer Name, Total (RM), Status, Payment Status, Date. Each row links to the order detail view.

**Quick Actions:**

| Action | Destination |
|--------|------------|
| Add New Product | `/admin/products/new` |
| View All Orders | `/admin/orders` |
| Check Inventory | `/admin/inventory` |
| Create Promotion | `/admin/promotions/new` |

### 4.2 Orders

**Route:** `/admin/orders`
**Purpose:** Full order lifecycle management from payment to delivery.

#### 4.2.1 Order List View

**Filters:**

| Filter | Options |
|--------|---------|
| Status | All, Pending, Processing, Shipped, Delivered, Cancelled |
| Payment Status | All, Pending, Paid, Failed, Refunded |
| Date Range | Today, Last 7 days, Last 30 days, Custom range |
| Search | By order number, customer name, or email |

**Table Columns:**

| Column | Source | Sortable |
|--------|--------|----------|
| Order Number | `orders.orderNumber` | No |
| Customer | `users.name` (joined) | Yes |
| Items | COUNT of `orderItems` for this order | No |
| Total | `orders.totalAmount` formatted as RM | Yes |
| Status | `orders.status` (color-coded badge) | Yes |
| Payment | `orders.paymentStatus` (color-coded badge) | Yes |
| Date | `orders.createdAt` | Yes (default: newest first) |
| Actions | View, Update Status | No |

**Status badge colors:**

| Status | Color |
|--------|-------|
| Pending | Yellow |
| Processing | Blue |
| Shipped | Purple |
| Delivered | Green |
| Cancelled | Red |

#### 4.2.2 Order Detail View

**Route:** `/admin/orders/:id`

Displays the complete order record including all shipping details, line items with size/color, payment information, and a status timeline. Admin can update the order status via a dropdown that only allows forward progression (pending → processing → shipped → delivered) or cancellation from any pre-delivery state.

**Order Detail Sections:**

| Section | Fields |
|---------|--------|
| Order Info | Order number, date, status, payment status |
| Customer | Name, email, phone (from shipping details) |
| Shipping Address | Full formatted address |
| Line Items | Product name, size, color, quantity, unit price, subtotal |
| Order Summary | Subtotal, shipping (if applicable), total |
| Payment | Stripe Payment Intent ID (linked to Stripe Dashboard) |
| Status History | Timeline of status changes with timestamps |

**Admin Actions on Order Detail:**

| Action | Conditions | Effect |
|--------|-----------|--------|
| Mark as Processing | Status is `pending`, payment is `paid` | Updates `status` to `processing` |
| Mark as Shipped | Status is `processing` | Updates `status` to `shipped` |
| Mark as Delivered | Status is `shipped` | Updates `status` to `delivered` |
| Cancel Order | Status is not `delivered` | Updates `status` to `cancelled` |
| Refund | Payment is `paid`, status is `cancelled` | Triggers Stripe refund, updates `paymentStatus` to `refunded` |

#### 4.2.3 Returns & Cancellations

**Route:** `/admin/orders?status=cancelled`

A filtered view of the orders list showing only cancelled orders. Each cancelled order with `paymentStatus = 'paid'` displays a "Process Refund" action button. Refunds are processed through the Stripe API using the stored `paymentIntentId`.

**Future enhancement:** A dedicated returns management system with return reason tracking, return shipping labels, and restocking workflows.

### 4.3 Products

**Route:** `/admin/products`
**Purpose:** Complete product catalog management — create, edit, price, categorize, and control visibility.

#### 4.3.1 Product List View

**Table Columns:**

| Column | Source | Description |
|--------|--------|-------------|
| Image | `products.imageUrl` | Thumbnail (48x48) |
| Product Name | `products.name` | With subtitle showing the slug |
| Category | `categories.name` (joined) | Category badge |
| Price | `products.price` | Formatted as RM XX.XX |
| Stock | `products.stockQuantity` | Red if < 10, bold red if 0 |
| Status | `products.active` | "Live" (green) or "Inactive" (gray) |
| Featured | `products.featured` | Star icon toggle |
| Actions | Edit, Deactivate/Activate, Delete | Action buttons |

**Filters:** Category dropdown, status (All / Live / Inactive), search by name or slug, sort by price/stock/date.

**Bulk Actions:** Select multiple products to bulk-update category, toggle active/featured status, or adjust pricing.

#### 4.3.2 Add / Edit Product

**Route:** `/admin/products/new` or `/admin/products/:id/edit`

**Form Fields:**

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Product Name | Text input | Min 1 character | Yes |
| Slug | Text input (auto-generated from name) | Unique, URL-safe | Yes |
| Description | Rich text / textarea | Supports MATERIALS: and CARE: markers | No |
| Price (RM) | Number input | Positive integer (stored as sen) | Yes |
| Category | Dropdown (from `categories`) | Must exist | Yes |
| Stock Quantity | Number input | Non-negative integer | Yes |
| Product Type | Dropdown | `physical`, `digital`, `bundle` | Yes |
| Featured | Toggle | Boolean | No |
| Active | Toggle | Boolean | No |
| Primary Image | File upload | Image file, uploaded to S3 | No |
| Additional Images | Multi-file upload | Each uploaded to S3, stored in `productImages` | No |

**Image upload flow:**
1. Admin selects file(s) in the browser
2. Frontend converts to base64 and calls `admin.products.uploadImage`
3. Server decodes, generates a unique S3 key (`products/{productId}/{nanoid}-{filename}`)
4. `storagePut()` uploads to S3 and returns the public URL
5. URL and key are stored in `productImages` table

#### 4.3.3 Inventory Management

**Route:** `/admin/inventory`
**Purpose:** Dedicated view for stock-level monitoring and bulk stock updates.

**Dashboard Cards:**

| Card | Query |
|------|-------|
| Total SKUs | COUNT of active products |
| In Stock | COUNT WHERE `stockQuantity > 0` |
| Low Stock (< 10 units) | COUNT WHERE `stockQuantity > 0 AND stockQuantity < 10` |
| Out of Stock | COUNT WHERE `stockQuantity = 0` |

**Inventory Table:** All active products sorted by stock quantity (ascending, so critical items appear first). Inline editable stock quantity field for quick updates without navigating to the full product edit form.

**Stock Deduction:** Inventory is automatically deducted when a Stripe `checkout.session.completed` webhook fires. The webhook handler iterates through order items and decrements `products.stockQuantity` for each line item. There is no reservation system — stock is deducted only after confirmed payment.

**Future enhancement:** Low-stock email alerts to the admin via the `notifyOwner()` helper when any product drops below a configurable threshold.

### 4.4 Customers

**Route:** `/admin/customers`
**Purpose:** View and manage the customer base. Understand purchasing behavior.

#### 4.4.1 Customer List

**Table Columns:**

| Column | Source | Description |
|--------|--------|-------------|
| Name | `users.name` | Customer display name |
| Email | `users.email` | Login email |
| Login Method | `users.loginMethod` | `email` or `oauth` |
| Orders | COUNT of `orders` for this user | Total order count |
| Total Spent | SUM of `orders.totalAmount` WHERE `paymentStatus = 'paid'` | Lifetime value (RM) |
| Joined | `users.createdAt` | Registration date |
| Last Active | `users.lastSignedIn` | Last login |

**Filters:** Search by name/email, sort by total spent / order count / join date, filter by login method.

#### 4.4.2 Customer Detail

**Route:** `/admin/customers/:id`

Displays the full customer profile: account info, order history (linked to order detail views), total lifetime value, and average order value. Admin can view but not edit customer passwords. Admin can promote a user to admin role or reset their password.

**Future enhancement:** Customer segments (VIP, repeat buyer, one-time buyer), customer notes, and communication history.

### 4.5 Analytics

**Route:** `/admin/analytics`
**Purpose:** Business intelligence for data-driven decisions. Revenue trends, product performance, and customer acquisition metrics.

#### 4.5.1 Sales Analytics

**Date range selector:** Today, Yesterday, Last 7 days, Last 30 days, Last 90 days, Custom range. All metrics show comparison to the previous equivalent period with percentage change.

**Primary Metrics:**

| Metric | Calculation |
|--------|------------|
| GMV (Gross Merchandise Value) | SUM of `orders.totalAmount` WHERE `paymentStatus = 'paid'` in period |
| Net Revenue | GMV minus refunds (orders WHERE `paymentStatus = 'refunded'`) |
| Total Orders | COUNT of paid orders in period |
| Average Order Value | GMV / Total Orders |
| Items Sold | SUM of `orderItems.quantity` for paid orders in period |

**Charts:**
1. **Revenue Trend** — Line chart of daily GMV over selected period
2. **Orders Trend** — Bar chart of daily order count
3. **Revenue by Category** — Pie/donut chart showing GMV breakdown by product category

#### 4.5.2 Product Analytics

**Route:** `/admin/analytics/products`

**Top Products Table:**

| Column | Calculation |
|--------|------------|
| Product Name | From `orderItems.productName` |
| Units Sold | SUM of `orderItems.quantity` |
| Revenue | SUM of `orderItems.subtotal` |
| Avg. Price | Revenue / Units Sold |
| Stock Remaining | Current `products.stockQuantity` |

Sorted by revenue (descending) by default. Filterable by category and date range.

**Category Performance:**

| Column | Calculation |
|--------|------------|
| Category | From `categories.name` |
| Products | COUNT of active products |
| Units Sold | SUM of order item quantities |
| Revenue | SUM of order item subtotals |
| % of Total Revenue | Category revenue / Total revenue |

#### 4.5.3 Customer Analytics

**Route:** `/admin/analytics/customers`

| Metric | Calculation |
|--------|------------|
| New Customers | COUNT of `users` created in period |
| Returning Customers | COUNT DISTINCT `orders.userId` with 2+ paid orders |
| Customer Lifetime Value (avg) | Total GMV / Total unique paying customers |
| Repeat Purchase Rate | Returning customers / Total paying customers |

**Future enhancement:** Cohort analysis, customer acquisition funnel, and geographic distribution (based on shipping addresses).

### 4.6 Promotions & Discounts

**Route:** `/admin/promotions`
**Purpose:** Create and manage discount codes, flash sales, and promotional campaigns.

> **Note:** Stripe Checkout natively supports promotion codes via `allow_promotion_codes: true`, which is already enabled in the checkout session creation. Promotion codes are managed directly in the Stripe Dashboard. This module provides a unified view and extends functionality beyond what Stripe offers natively.

#### 4.6.1 Promotion Types

| Type | Description | Implementation |
|------|-------------|----------------|
| Percentage Discount | X% off entire order | Stripe Coupon with `percent_off` |
| Fixed Amount Discount | RM X off entire order | Stripe Coupon with `amount_off` in MYR |
| Free Shipping | Waive shipping fee | Applied at checkout calculation |
| Buy X Get Y | Purchase threshold triggers free item | Custom logic + Stripe line items |
| Flash Sale | Time-limited price reduction on specific products | Temporary `price` override in database |

#### 4.6.2 Promotion Management

**Fields for creating a promotion:**

| Field | Type | Description |
|-------|------|-------------|
| Code | Text | Customer-facing promo code (e.g., `FAKE20`) |
| Type | Dropdown | Percentage, Fixed Amount, Free Shipping |
| Value | Number | Discount percentage or amount |
| Minimum Order | Number | Minimum cart value to qualify (RM) |
| Usage Limit | Number | Maximum total redemptions (null = unlimited) |
| Per-Customer Limit | Number | Max uses per customer |
| Start Date | DateTime | When the promotion becomes active |
| End Date | DateTime | When the promotion expires |
| Applicable Categories | Multi-select | Restrict to specific categories (null = all) |
| Active | Toggle | Enable/disable without deleting |

**Current state:** Promotion codes are managed in the Stripe Dashboard. This module is planned for Phase 2 to bring promotion management into the Seller Center with local tracking of redemption counts and campaign attribution.

### 4.7 Shipping Settings

**Route:** `/admin/settings/shipping`
**Purpose:** Configure shipping rates, zones, and fulfillment rules.

#### 4.7.1 Shipping Zones

| Zone | Coverage | Description |
|------|----------|-------------|
| Peninsular Malaysia | West Malaysia states | Primary market |
| East Malaysia | Sabah, Sarawak | Extended delivery times |
| International | All other countries | Future expansion |

#### 4.7.2 Shipping Rate Configuration

| Setting | Type | Description |
|---------|------|-------------|
| Free Shipping Threshold | Number (RM) | Orders above this amount ship free (currently RM 75) |
| Flat Rate (Peninsular) | Number (RM) | Standard shipping fee for West Malaysia |
| Flat Rate (East Malaysia) | Number (RM) | Standard shipping fee for East Malaysia |
| Express Shipping Premium | Number (RM) | Additional charge for express delivery |
| Estimated Delivery (Standard) | Text | e.g., "3-5 business days" |
| Estimated Delivery (Express) | Text | e.g., "1-2 business days" |

**Current state:** Shipping is handled as a flat rate with free shipping over RM 75 (displayed on the storefront). Shipping cost calculation is not yet integrated into the checkout total — this is a Phase 2 feature that requires adding shipping as a Stripe line item or using Stripe's shipping rate feature.

### 4.8 Site Settings

**Route:** `/admin/settings`
**Purpose:** Global store configuration.

#### 4.8.1 General Settings

| Setting | Type | Description |
|---------|------|-------------|
| Store Name | Text | "Fake by Freetown" |
| Store Tagline | Text | Brand tagline displayed on storefront |
| Contact Email | Email | Customer support email |
| Contact Phone | Phone | Customer support phone |
| Currency | Dropdown | MYR (Malaysian Ringgit) — currently hardcoded |
| Default Country | Dropdown | Malaysia |
| Timezone | Dropdown | Asia/Kuala_Lumpur |

#### 4.8.2 Payment Settings

Managed via the Manus Settings panel (Settings → Payment). Environment variables `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are injected automatically.

| Setting | Source | Description |
|---------|--------|-------------|
| Stripe Mode | Environment | Test or Live (based on key prefix `sk_test_` vs `sk_live_`) |
| Webhook Status | Stripe Dashboard | Active/Inactive, last event timestamp |
| Accepted Payment Methods | Stripe Checkout config | Currently: Card only |

#### 4.8.3 Notification Settings

| Notification | Trigger | Channel |
|-------------|---------|---------|
| New Order | `checkout.session.completed` webhook | `notifyOwner()` push notification |
| Low Stock Alert | Product stock < threshold | `notifyOwner()` push notification |
| Failed Payment | `payment_intent.payment_failed` webhook | Console log (email planned) |
| New Customer Registration | `auth.register` mutation | Console log (email planned) |

---

## 5. API Procedure Reference

### 5.1 Public Procedures (No Auth Required)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `auth.me` | Query | — | `User \| null` | Returns current session user |
| `auth.register` | Mutation | `{ email, password, name? }` | `{ success, user }` | Create account, set JWT cookie |
| `auth.login` | Mutation | `{ email, password, rememberMe? }` | `{ success, user }` | Verify credentials, set JWT cookie |
| `auth.requestPasswordReset` | Mutation | `{ email }` | `{ success, message }` | Generate reset token (1hr TTL) |
| `auth.resetPassword` | Mutation | `{ token, newPassword }` | `{ success, message }` | Verify token, update password hash |
| `auth.logout` | Mutation | — | `{ success }` | Clear session cookie |
| `categories.list` | Query | — | `Category[]` | All categories, sorted by name |
| `categories.getById` | Query | `{ id }` | `Category` | Single category by ID |
| `products.list` | Query | `{ categoryId?, search?, featured? }` | `Product[]` | Filtered product list (active only) |
| `products.getById` | Query | `{ id }` | `Product & { category, images }` | Product with category and images |
| `products.getBySlug` | Query | `{ slug }` | `Product & { category, images }` | Product lookup by URL slug |
| `products.getRelated` | Query | `{ productId, limit? }` | `Product[]` | Same-category products (excl. self) |

### 5.2 Protected Procedures (Auth Required)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `cart.get` | Query | — | `{ items, total, itemCount }` | Current user's cart with product joins |
| `cart.add` | Mutation | `{ productId, quantity, size, color }` | `{ success }` | Add to cart (upserts if exists) |
| `cart.update` | Mutation | `{ productId, quantity }` | `{ success }` | Update quantity by product ID |
| `cart.updateQuantity` | Mutation | `{ id, quantity }` | `{ success }` | Update quantity by cart item ID |
| `cart.remove` | Mutation | `{ id }` | `{ success }` | Remove item from cart |
| `cart.clear` | Mutation | — | `{ success }` | Empty entire cart |
| `checkout.createSession` | Mutation | Shipping details object | `{ sessionId, url, orderNumber }` | Create order + Stripe session |
| `orders.list` | Query | — | `Order[]` | Current user's orders |
| `orders.getById` | Query | `{ id }` | `Order & { items }` | Order detail (owner or admin) |
| `orders.getByNumber` | Query | `{ orderNumber }` | `Order & { items }` | Order by number (owner or admin) |

### 5.3 Admin Procedures (Admin Role Required)

| Procedure | Type | Input | Output | Description |
|-----------|------|-------|--------|-------------|
| `products.create` | Mutation | Product fields | `{ id, ...fields }` | Create new product (slug uniqueness check) |
| `products.update` | Mutation | `{ id, ...partial fields }` | `{ success }` | Update product (slug conflict check) |
| `products.delete` | Mutation | `{ id }` | `{ success }` | Soft-delete (set `active = false`) |
| `admin.products.list` | Query | — | `Product[]` | All products including inactive |
| `admin.products.create` | Mutation | Product fields | `{ success }` | Create product (admin route) |
| `admin.products.update` | Mutation | `{ id, ...fields }` | `{ success }` | Update product (admin route) |
| `admin.products.delete` | Mutation | `{ id }` | `{ success }` | Delete product (admin route) |
| `admin.products.uploadImage` | Mutation | `{ productId, imageData, fileName, mimeType }` | `{ url, fileKey }` | Upload image to S3 |
| `admin.orders.list` | Query | — | `(Order & { user })[]` | All orders with customer info |
| `admin.orders.updateStatus` | Mutation | `{ id, status }` | `{ success }` | Change order status |

---

## 6. Stripe Integration

### 6.1 Configuration

| Variable | Purpose | Source |
|----------|---------|--------|
| `STRIPE_SECRET_KEY` | Server-side API calls | Auto-injected (Settings → Payment) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend Stripe.js initialization | Auto-injected |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Auto-injected |

**API Version:** `2025-11-17.clover`
**Currency:** `myr` (Malaysian Ringgit)
**Mode:** Test sandbox (production keys available after Stripe KYC)

### 6.2 Checkout Flow

```
1. Customer fills shipping form on /checkout
2. Frontend calls checkout.createSession with shipping details
3. Server:
   a. Validates cart is not empty
   b. Checks stock availability for all items
   c. Generates order number (ORD-{nanoid})
   d. Creates order record (status: pending, paymentStatus: pending)
   e. Creates order items (snapshots of product name/price)
   f. Calls stripe.checkout.sessions.create() with:
      - Line items (name, price in sen, quantity, images)
      - Currency: myr
      - Success URL: /order-confirmation?session_id={CHECKOUT_SESSION_ID}
      - Cancel URL: /cart
      - Customer email prefilled
      - Promotion codes enabled
      - Metadata: user_id, order_id, order_number
4. Server returns { sessionId, url, orderNumber }
5. Frontend opens Stripe Checkout URL in new tab
6. Customer completes payment on Stripe-hosted page
7. Stripe redirects to success URL
```

### 6.3 Webhook Processing

**Endpoint:** `POST /api/stripe/webhook`
**Body parsing:** `express.raw({ type: 'application/json' })` — registered BEFORE `express.json()` to preserve raw body for signature verification.

**Event handling:**

| Event | Action |
|-------|--------|
| `evt_test_*` | Return `{ verified: true }` immediately (test event verification) |
| `checkout.session.completed` | Extract `orderId` from metadata → update order to `processing`/`paid` → deduct inventory |
| `payment_intent.succeeded` | Log success (order already updated by checkout.session.completed) |
| `payment_intent.payment_failed` | Log failure (future: update order, notify customer) |
| All others | Log and acknowledge with 200 |

**Inventory deduction logic (on checkout.session.completed):**

```
For each orderItem in the completed order:
  1. Get current product stock
  2. Calculate new stock = current - orderItem.quantity
  3. Update products.stockQuantity
```

There is no stock reservation during checkout. If two customers check out the same last-unit item simultaneously, both orders may succeed and stock could go negative. This is an accepted trade-off for simplicity — the admin resolves oversells manually.

### 6.4 Test Payment

| Field | Value |
|-------|-------|
| Card Number | 4242 4242 4242 4242 |
| Expiry | Any future date |
| CVC | Any 3 digits |
| Postal Code | Any valid code |

---

## 7. File Storage Architecture

All product images and digital assets are stored in S3 via the Manus Storage Proxy. The database stores only URLs and keys — never file bytes.

**Upload flow (admin image upload):**

```
Admin selects file → Frontend base64 encodes → tRPC mutation
                                                     ↓
Server decodes base64 → storagePut(key, buffer, mimeType)
                                                     ↓
S3 proxy uploads → returns public URL
                                                     ↓
URL + key stored in productImages table
```

**Key naming convention:** `products/{productId}/{nanoid}-{originalFilename}`

**Storage helpers:**

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `storagePut(relKey, data, contentType)` | Key path, file buffer, MIME type | `{ key, url }` | Upload file to S3 |
| `storageGet(relKey)` | Key path | `{ key, url }` | Get presigned download URL |

---

## 8. Seller Center Module Roadmap

The following table summarizes the implementation status and priority of each Seller Center module.

| Module | Status | Priority | Phase |
|--------|--------|----------|-------|
| Dashboard (Homepage) | **To Build** | P0 — Critical | Phase 1 |
| Order Management | **Partially Built** (list, detail, status update) | P0 — Critical | Phase 1 |
| Product Management | **Partially Built** (CRUD, image upload) | P0 — Critical | Phase 1 |
| Inventory Management | **To Build** (dedicated view) | P0 — Critical | Phase 1 |
| Customer Management | **To Build** | P1 — High | Phase 1 |
| Sales Analytics | **To Build** | P1 — High | Phase 1 |
| Product Analytics | **To Build** | P2 — Medium | Phase 2 |
| Customer Analytics | **To Build** | P2 — Medium | Phase 2 |
| Promotions & Discounts | **To Build** (Stripe promo codes exist) | P2 — Medium | Phase 2 |
| Shipping Settings | **To Build** | P2 — Medium | Phase 2 |
| Site Settings | **To Build** | P3 — Low | Phase 2 |
| Returns Management | **To Build** | P2 — Medium | Phase 2 |
| Refund Processing | **To Build** | P1 — High | Phase 1 |
| Email Notifications | **To Build** | P2 — Medium | Phase 2 |
| Digital Products | **Schema Ready** | P3 — Low | Phase 3 |
| Content/Blog | **Schema Ready** | P3 — Low | Phase 3 |

---

## 9. Schema Changes Required for Full Seller Center

The following new tables and columns are needed to support the complete Seller Center feature set.

### 9.1 New Tables

#### `promotions` — Discount Codes and Campaigns

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Promotion ID |
| `code` | VARCHAR(50) UNIQUE | Customer-facing code |
| `type` | ENUM(`'percentage'`, `'fixed'`, `'free_shipping'`) | Discount type |
| `value` | INT | Discount value (percentage or sen) |
| `minOrderAmount` | INT nullable | Minimum order to qualify (sen) |
| `maxUsage` | INT nullable | Total redemption limit |
| `usageCount` | INT default 0 | Current redemption count |
| `perCustomerLimit` | INT nullable | Per-customer limit |
| `startDate` | TIMESTAMP | Activation date |
| `endDate` | TIMESTAMP | Expiration date |
| `active` | BOOLEAN default true | Enable/disable |
| `createdAt` | TIMESTAMP | Creation |

#### `shippingZones` — Shipping Rate Configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Zone ID |
| `name` | VARCHAR(100) | Zone name |
| `states` | TEXT | Comma-separated state codes |
| `flatRate` | INT | Shipping cost in sen |
| `freeShippingThreshold` | INT nullable | Free shipping above this amount (sen) |
| `estimatedDays` | VARCHAR(50) | e.g., "3-5 business days" |
| `active` | BOOLEAN default true | Enable/disable |

#### `orderStatusHistory` — Audit Trail for Order Changes

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | History ID |
| `orderId` | INT | FK to orders |
| `previousStatus` | VARCHAR(50) | Status before change |
| `newStatus` | VARCHAR(50) | Status after change |
| `changedBy` | INT | FK to users (admin who made the change) |
| `note` | TEXT nullable | Optional note (e.g., tracking number) |
| `createdAt` | TIMESTAMP | Change timestamp |

#### `activityLog` — Admin Action Audit

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Log ID |
| `userId` | INT | FK to users (admin) |
| `action` | VARCHAR(100) | Action type (e.g., `product.create`, `order.status.update`) |
| `entityType` | VARCHAR(50) | Entity type (product, order, user) |
| `entityId` | INT | Entity ID |
| `details` | TEXT nullable | JSON payload of changes |
| `createdAt` | TIMESTAMP | Action timestamp |

### 9.2 Column Additions to Existing Tables

| Table | Column | Type | Description |
|-------|--------|------|-------------|
| `products` | `sku` | VARCHAR(100) UNIQUE | Stock Keeping Unit identifier |
| `products` | `weight` | INT nullable | Weight in grams (for shipping calc) |
| `products` | `compareAtPrice` | INT nullable | Original price for "was/now" display (sen) |
| `orders` | `shippingMethod` | VARCHAR(50) | `standard` or `express` |
| `orders` | `shippingCost` | INT default 0 | Shipping fee in sen |
| `orders` | `trackingNumber` | VARCHAR(255) nullable | Carrier tracking number |
| `orders` | `trackingUrl` | TEXT nullable | Tracking URL |
| `orders` | `notes` | TEXT nullable | Internal admin notes |
| `orders` | `refundedAmount` | INT default 0 | Partial/full refund amount (sen) |

---

## 10. Authentication Architecture

The system supports two independent authentication methods that coexist within a single session resolution pipeline. Every inbound request to `/api/trpc` passes through the `createContext()` function in `server/_core/context.ts`, which attempts to identify the user before any procedure executes.

### 10.1 Authentication Methods

| Method | Entry Point | Token Type | Storage | Expiry | Use Case |
|--------|------------|-----------|---------|--------|----------|
| Email/Password | `auth.register` / `auth.login` | JWT (jsonwebtoken) | HTTP-only cookie (`app_session_id`) | 7d / 30d | Primary customer auth |
| Manus OAuth | `/api/oauth/callback` | JWT (jose/HS256) | HTTP-only cookie (`app_session_id`) | 1 year | Owner/admin SSO |

Both methods write to the same cookie name (`app_session_id`). The context resolver tries JWT verification first (via the `jsonwebtoken` library), and if that fails, falls back to OAuth session verification (via the `jose` library). This dual-path design means the system never needs to distinguish between auth methods at the middleware level — the cookie either resolves to a user or it does not.

### 10.2 Session Resolution Flow

```
Inbound Request
      |
Extract cookie: app_session_id
      |
+-- Cookie present? -------------------------------------------+
|  YES                                                          |
|  +-- Try jwt.verify(token, JWT_SECRET)                        |
|  |   +-- Success --> getUserByEmail(decoded.email)             |
|  |   |              --> ctx.user = User                        |
|  |   +-- Fail --> Try OAuth fallback                           |
|  |                +-- sdk.verifySession(token)                 |
|  |                |   +-- Success --> sdk.authenticateRequest   |
|  |                |   |              --> upsert user --> ctx    |
|  |                |   +-- Fail --> ctx.user = null              |
|  NO                                                           |
|  +-- Try OAuth (sdk.authenticateRequest)                      |
|  |   +-- Success --> ctx.user = User                           |
|  |   +-- Fail --> ctx.user = null                              |
+---------------------------------------------------------------+
      |
ctx.user is now User | null
      |
publicProcedure  --> proceeds regardless
protectedProcedure --> throws UNAUTHORIZED if null
adminProcedure   --> throws FORBIDDEN if role != 'admin'
```

### 10.3 Password Security

Passwords are hashed using **bcrypt** with 10 salt rounds via the `bcryptjs` library. The system enforces the following password policy at both the API layer (Zod validation) and the helper layer (`auth.isValidPassword()`):

| Requirement | Enforcement |
|------------|-------------|
| Minimum 8 characters | `z.string().min(8)` + `isValidPassword()` |
| At least 1 uppercase letter | `/[A-Z]/` regex check |
| At least 1 lowercase letter | `/[a-z]/` regex check |
| At least 1 number | `/[0-9]/` regex check |
| No maximum length | bcrypt handles any length (hashes to 60 chars) |

Password hashes are stored in the `users.passwordHash` column (VARCHAR 255). The column is nullable because OAuth-only users never set a password. Login attempts against OAuth-only accounts (where `passwordHash` is null) are rejected with a generic "Invalid email or password" message to prevent account enumeration.

### 10.4 Password Reset Flow

```
1. Customer calls auth.requestPasswordReset({ email })
2. Server generates 32-byte random hex token via crypto.randomBytes(32)
3. Token + expiry (current time + 1 hour) stored in users table
4. Response always returns "If email exists, reset link sent"
   (no email enumeration leakage)
5. Customer calls auth.resetPassword({ token, newPassword })
6. Server verifies token exists AND is not expired
7. Password is re-hashed and stored; token fields are nulled out
```

**Current limitation:** The reset token is generated and stored, but no email delivery mechanism is implemented yet. The token is logged to the server console for development purposes. Email integration (via SendGrid, Resend, or similar) is a Phase 2 requirement.

### 10.5 JWT Token Structure

**Email/Password JWT payload:**

```json
{
  "userId": 42,
  "email": "customer@example.com",
  "iat": 1711468800,
  "exp": 1712073600
}
```

Signed with `JWT_SECRET` using the default HS256 algorithm via the `jsonwebtoken` library.

**OAuth Session JWT payload:**

```json
{
  "openId": "manus_user_abc123",
  "appId": "app_xyz",
  "name": "Store Owner",
  "exp": 1743004800
}
```

Signed with `JWT_SECRET` (same key, aliased as `cookieSecret`) using HS256 via the `jose` library.

### 10.6 Cookie Configuration

All session cookies are set with the following security attributes, determined dynamically by `getSessionCookieOptions()` in `server/_core/cookies.ts`:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `httpOnly` | `true` | Prevents JavaScript access (XSS mitigation) |
| `path` | `/` | Cookie available on all routes |
| `sameSite` | `none` | Required for cross-origin requests (Manus proxy) |
| `secure` | Dynamic | `true` if request is HTTPS (checked via `x-forwarded-proto`) |
| `maxAge` | 7d / 30d / 1yr | Depends on auth method and "remember me" flag |

### 10.7 Role-Based Access Control

The system enforces three tiers of access via tRPC middleware:

| Tier | Middleware | Check | Failure Response |
|------|-----------|-------|-----------------|
| Public | `publicProcedure` | None | Always proceeds |
| Authenticated | `protectedProcedure` | `ctx.user !== null` | `UNAUTHORIZED` (HTTP 401) |
| Admin | `adminProcedure` | `ctx.user.role === 'admin'` | `FORBIDDEN` (HTTP 403) |

Admin promotion is handled through two mechanisms. The store owner is automatically promoted to admin when their `openId` matches the `OWNER_OPEN_ID` environment variable during OAuth authentication. Additional admins are promoted by directly updating the `role` field in the `users` table via the database management UI or SQL.

### 10.8 Owner Auto-Promotion

When a user authenticates via OAuth and their `openId` matches `ENV.ownerOpenId`, the system automatically sets their role to `admin`. This happens during the `sdk.authenticateRequest()` flow in `server/_core/sdk.ts`, which calls `db.upsertUser()`. The upsert logic checks the `OWNER_OPEN_ID` match and assigns the admin role accordingly.

---

## 11. Secret Management and Key Security

### 11.1 Environment Variable Inventory

The system uses 17 environment variables, divided into three categories based on sensitivity and origin.

**Platform-Injected Secrets (auto-configured, never committed to code):**

| Variable | Sensitivity | Purpose | Rotation |
|----------|-----------|---------|----------|
| `DATABASE_URL` | Critical | MySQL/TiDB connection string with credentials | Platform-managed |
| `JWT_SECRET` | Critical | Signs all session JWTs (both email and OAuth) | Platform-managed |
| `STRIPE_SECRET_KEY` | Critical | Server-side Stripe API access | Via Settings > Payment |
| `STRIPE_WEBHOOK_SECRET` | Critical | Verifies Stripe webhook signatures | Via Settings > Payment |
| `BUILT_IN_FORGE_API_KEY` | High | Server-side access to Manus APIs (LLM, storage, notifications) | Platform-managed |
| `BUILT_IN_FORGE_API_URL` | Low | Manus API base URL | Platform-managed |
| `OAUTH_SERVER_URL` | Low | Manus OAuth backend URL | Platform-managed |
| `OWNER_OPEN_ID` | Medium | Identifies the store owner for auto-admin promotion | Platform-managed |
| `OWNER_NAME` | Low | Store owner display name | Platform-managed |

**Frontend-Exposed Variables (prefixed with `VITE_`, embedded in client bundle):**

| Variable | Sensitivity | Purpose | Exposure |
|----------|-----------|---------|----------|
| `VITE_APP_ID` | Low | Manus OAuth application ID | Public (client bundle) |
| `VITE_OAUTH_PORTAL_URL` | Low | Manus login portal URL | Public |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Low | Stripe.js initialization (publishable, not secret) | Public |
| `VITE_FRONTEND_FORGE_API_KEY` | Medium | Frontend access to Manus APIs | Public (rate-limited) |
| `VITE_FRONTEND_FORGE_API_URL` | Low | Manus API URL for frontend | Public |
| `VITE_APP_TITLE` | Low | Site title | Public |
| `VITE_APP_LOGO` | Low | Site logo URL | Public |
| `VITE_ANALYTICS_ENDPOINT` | Low | Analytics tracking endpoint | Public |
| `VITE_ANALYTICS_WEBSITE_ID` | Low | Analytics site identifier | Public |

### 11.2 Secret Handling Rules

The following rules govern how secrets are managed across the codebase:

**Never committed to source control.** The `.env` file is gitignored. All secrets are injected at runtime by the hosting platform (Manus) or set via the Settings > Secrets panel. The `server/_core/env.ts` module reads from `process.env` with empty-string fallbacks — it never contains actual values.

**Server-side secrets never reach the client.** Only variables prefixed with `VITE_` are bundled into the frontend by Vite. The `STRIPE_SECRET_KEY`, `DATABASE_URL`, `JWT_SECRET`, and `BUILT_IN_FORGE_API_KEY` are exclusively server-side. The Stripe publishable key (`VITE_STRIPE_PUBLISHABLE_KEY`) is intentionally public — Stripe designed it for client-side use.

**No secrets in database columns.** The database stores Stripe resource IDs (payment intent IDs, session IDs) but never API keys, webhook secrets, or raw tokens. Password reset tokens are the only sensitive tokens stored in the database, and they expire after 1 hour.

**No secrets in URL parameters.** The Stripe checkout flow uses server-created sessions. The only URL parameter is the `session_id` on the success redirect, which is a Stripe-generated opaque identifier.

### 11.3 Secret Rotation Procedures

| Secret | Rotation Method | Impact | Downtime |
|--------|----------------|--------|----------|
| `JWT_SECRET` | Update via Settings > Secrets | All existing sessions invalidated; users must re-login | Zero (graceful) |
| `STRIPE_SECRET_KEY` | Update via Settings > Payment | New key takes effect immediately; in-flight checkouts complete with old key | Zero |
| `STRIPE_WEBHOOK_SECRET` | Regenerate in Stripe Dashboard, update in Settings | Webhook signature verification uses new secret | Brief (seconds) |
| `DATABASE_URL` | Platform-managed rotation | Connection pool reconnects automatically | Zero |
| `BUILT_IN_FORGE_API_KEY` | Platform-managed | LLM, storage, and notification calls use new key | Zero |

### 11.4 Sensitive Data Classification

| Data Type | Classification | Storage | Access |
|-----------|---------------|---------|--------|
| Passwords | Restricted | bcrypt hash only; plaintext never stored or logged | Server-side only |
| Payment card numbers | Prohibited | Never touches our servers (Stripe Checkout handles PCI) | N/A |
| Customer emails | Personal | `users.email` column | Admin + account owner |
| Shipping addresses | Personal | `orders` table columns | Admin + order owner |
| Stripe Payment Intent IDs | Internal | `orders.paymentIntentId` | Admin only |
| JWT tokens | Session | HTTP-only cookies (not accessible via JS) | Browser + server |
| Password reset tokens | Temporary | `users.resetToken` (nulled after use, 1hr TTL) | Server-side only |

---

## 12. Security Posture

### 12.1 Transport Security

All traffic between the browser and the server is encrypted via HTTPS. The hosting platform terminates TLS at the edge proxy and forwards requests to the Express server over HTTP internally. The `secure` cookie flag is set dynamically based on the `x-forwarded-proto` header, ensuring cookies are only transmitted over HTTPS in production.

### 12.2 Input Validation

Every tRPC procedure input is validated using **Zod schemas** before the procedure body executes. This provides type-safe runtime validation at the API boundary. Examples of enforced constraints:

| Procedure | Validation |
|-----------|-----------|
| `auth.register` | `email: z.string().email()`, `password: z.string().min(8)` + custom strength check |
| `auth.login` | `email: z.string().email()`, `password: z.string()` |
| `products.create` | `name: z.string().min(1)`, `price: z.number().int().positive()`, `slug: z.string().min(1)` |
| `cart.add` | `productId: z.number()`, `quantity: z.number().int().positive()`, `size: z.string()`, `color: z.string()` |
| `checkout.createSession` | Full shipping address object with all fields required |

Invalid inputs are rejected with a `BAD_REQUEST` error before any database query executes.

### 12.3 SQL Injection Prevention

The application uses **Drizzle ORM** exclusively for database access. All queries are constructed using Drizzle's query builder, which automatically parameterizes values. There are no raw SQL string interpolations anywhere in the codebase. The `db.ts` helper module provides typed functions that accept validated inputs and return typed results.

### 12.4 Cross-Site Request Forgery (CSRF)

Session cookies use `sameSite: 'none'` with `secure: true` to support cross-origin requests through the Manus proxy. While `sameSite: 'none'` does not provide CSRF protection on its own, the tRPC protocol uses POST requests with JSON content types for all mutations, which provides implicit CSRF protection because browsers do not send `application/json` content types in simple cross-origin form submissions.

**Portability note:** When self-hosting, switch `sameSite` to `'lax'` or `'strict'` if the frontend and backend share the same origin. This provides stronger CSRF protection without the cross-origin requirement.

### 12.5 Stripe Webhook Verification

Every incoming webhook request to `POST /api/stripe/webhook` is verified using Stripe's signature verification before any processing occurs. The raw request body (preserved by registering `express.raw()` before `express.json()`) is passed to `stripe.webhooks.constructEvent()` along with the `stripe-signature` header and the `STRIPE_WEBHOOK_SECRET`. If verification fails, the request is rejected with HTTP 400. Test events (where `event.id` starts with `evt_test_`) are acknowledged with `{ verified: true }` without processing.

### 12.6 File Upload Security

Product image uploads are processed server-side through the `admin.products.uploadImage` tRPC mutation (admin-only). The flow is:

1. Frontend converts the file to base64 and sends it via tRPC
2. Server validates the admin role
3. Server decodes base64 to a Buffer
4. Buffer is uploaded to S3 via `storagePut()` with a generated key
5. Only the resulting URL and key are stored in the database

Files are never written to the local filesystem. The S3 bucket is configured for public read access, so returned URLs work without additional signing. File keys include random suffixes (`nanoid`) to prevent enumeration.

### 12.7 Security Gaps and Recommendations

| Gap | Risk Level | Recommendation | Priority |
|-----|-----------|----------------|----------|
| No rate limiting on auth endpoints | High | Add `express-rate-limit` middleware: 5 attempts/15min for login, 3/hour for password reset | P0 |
| No CAPTCHA on registration | Medium | Add hCaptcha or Cloudflare Turnstile to prevent bot registrations | P1 |
| No account lockout after failed logins | Medium | Lock account for 15 minutes after 5 consecutive failures | P1 |
| No email verification enforcement | Medium | Block checkout for unverified emails; send verification link on register | P1 |
| No Content Security Policy header | Medium | Add CSP header to prevent XSS via injected scripts | P2 |
| No CORS configuration | Low | Add explicit CORS whitelist when self-hosting (currently handled by proxy) | P2 |
| Password reset token in console log | Low | Replace with email delivery service (SendGrid/Resend) | P1 |
| No request body size limit on webhook | Low | Already mitigated by Stripe's own payload limits | P3 |
| No audit logging for admin actions | Medium | Implement `activityLog` table (schema defined in Section 9) | P1 |
| Stock deduction not atomic | Medium | Wrap inventory deduction in a database transaction with row-level locking | P1 |

---

## 13. Portability Architecture

This section defines how to extract the entire application from the Manus platform and run it independently on any infrastructure. The system has **six external dependencies** that must be replaced or reconfigured for self-hosting.

### 13.1 Dependency Map

| Dependency | Current Provider | Abstraction Layer | Self-Hosted Replacement |
|-----------|-----------------|-------------------|------------------------|
| Database | TiDB (Manus-managed MySQL) | Drizzle ORM (`drizzle-orm/mysql2`) | Any MySQL 8+ / MariaDB / PlanetScale / AWS RDS |
| Authentication (OAuth) | Manus OAuth | `server/_core/sdk.ts` | Remove OAuth path; use email/password only, or swap for Auth0/Clerk/NextAuth |
| File Storage | Manus Storage Proxy (S3-compatible) | `server/storage.ts` | AWS S3 / Cloudflare R2 / MinIO / DigitalOcean Spaces |
| LLM Service | Manus Forge API | `server/_core/llm.ts` | OpenAI API / Anthropic / Google AI / Ollama (local) |
| Notifications | Manus Notification Service | `server/_core/notification.ts` | SendGrid / Resend / Nodemailer / Slack webhook |
| Payments | Stripe | `server/stripe.ts` | Stripe (no change needed — already portable) |

### 13.2 Database Portability

The database layer is already portable. Drizzle ORM connects via a standard MySQL connection string (`DATABASE_URL`). To migrate:

1. Export the schema: `pnpm drizzle-kit generate` produces SQL migration files in `drizzle/`
2. Point `DATABASE_URL` to your new MySQL instance
3. Run `pnpm db:push` to apply the schema
4. Seed data using the SQL insert statements or a custom seed script

**Connection string format:** `mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}`

The Drizzle config (`drizzle.config.ts`) reads `DATABASE_URL` from the environment and uses the `mysql` dialect. No code changes are needed — only the connection string changes.

### 13.3 Authentication Portability

The authentication system has two paths. The **email/password path is fully portable** — it uses standard bcrypt hashing, JWT signing with `jsonwebtoken`, and cookie-based sessions. No external service is required.

The **Manus OAuth path** (`server/_core/sdk.ts`) is platform-specific and must be replaced for self-hosting. The migration strategy:

**Option A: Remove OAuth entirely.** Delete the OAuth routes from `server/_core/oauth.ts`, remove the OAuth fallback from `server/_core/context.ts`, and rely exclusively on email/password authentication. This is the simplest path.

**Option B: Replace with a standard OAuth provider.** Swap the Manus OAuth endpoints in `sdk.ts` with Google OAuth, GitHub OAuth, or any OpenID Connect provider. The session token structure remains the same — only the token exchange and user info endpoints change.

**Option C: Use an auth service.** Replace the entire auth layer with Auth0, Clerk, or Supabase Auth. This requires rewriting `context.ts` to verify tokens from the new provider and mapping their user model to the local `users` table.

**Files to modify for auth portability:**

| File | Change Required |
|------|----------------|
| `server/_core/context.ts` | Remove OAuth fallback path; keep JWT-only verification |
| `server/_core/sdk.ts` | Delete entirely (or replace with new OAuth provider) |
| `server/_core/oauth.ts` | Delete or replace OAuth callback route |
| `server/_core/cookies.ts` | Change `sameSite` from `'none'` to `'lax'` if same-origin |
| `server/routers.ts` | No changes needed (email/password auth is self-contained) |

### 13.4 Storage Portability

The storage layer (`server/storage.ts`) currently uses the Manus Storage Proxy, which is an HTTP API wrapping S3. To self-host, replace the `storagePut` and `storageGet` functions with direct S3 SDK calls:

**Replacement implementation using `@aws-sdk/client-s3`** (already in `package.json`):

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
  }));
  return {
    key,
    url: `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`,
  };
}

export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }), { expiresIn });
  return { key, url };
}
```

**New environment variables needed:**

| Variable | Example | Purpose |
|----------|---------|---------|
| `S3_REGION` | `ap-southeast-1` | AWS region |
| `S3_ACCESS_KEY_ID` | `AKIA...` | IAM access key |
| `S3_SECRET_ACCESS_KEY` | `wJal...` | IAM secret key |
| `S3_BUCKET` | `fake-by-freetown-assets` | Bucket name |

For **Cloudflare R2**, use the same S3 SDK with the R2 endpoint URL. For **MinIO** (self-hosted S3), point the S3 client at your MinIO instance URL.

### 13.5 LLM Service Portability

The LLM helper (`server/_core/llm.ts`) uses an OpenAI-compatible API endpoint. The current implementation calls the Manus Forge API, but the request format is standard OpenAI Chat Completions. To self-host:

**Option A: OpenAI directly.** Set `BUILT_IN_FORGE_API_URL` to `https://api.openai.com` and `BUILT_IN_FORGE_API_KEY` to your OpenAI API key. Change the model in `llm.ts` from `gemini-2.5-flash` to `gpt-4o` or your preferred model.

**Option B: Any OpenAI-compatible provider.** Anthropic (via their OpenAI-compatible endpoint), Together AI, Groq, or a local Ollama instance all work — just change the URL and key.

**Option C: Remove LLM entirely.** If your store does not use AI features (product descriptions, chat support, etc.), delete the LLM module. It is not required for core e-commerce operations.

### 13.6 Notification Portability

The notification helper (`server/_core/notification.ts`) sends push notifications to the store owner via the Manus Notification Service. To self-host, replace with any of:

| Replacement | Implementation |
|------------|---------------|
| Email (SendGrid) | `sgMail.send({ to: ADMIN_EMAIL, subject: title, text: content })` |
| Email (Resend) | `resend.emails.send({ from, to: ADMIN_EMAIL, subject: title, html: content })` |
| Email (Nodemailer) | SMTP-based email via `nodemailer.createTransport()` |
| Slack | POST to a Slack webhook URL with `{ text: title + content }` |
| Discord | POST to a Discord webhook URL |
| SMS (Twilio) | `twilio.messages.create({ body: title, to: ADMIN_PHONE })` |

The `notifyOwner()` function signature remains the same — only the internal HTTP call changes.

### 13.7 Payment Portability

Stripe is already fully portable. The integration uses the standard Stripe Node.js SDK with environment variables for configuration. No Manus-specific abstractions exist in the payment layer. To move to production:

1. Complete Stripe KYC verification
2. Replace test keys with live keys in environment variables
3. Update the webhook endpoint URL in the Stripe Dashboard to point to your new domain
4. The 99% discount promo code is available for live mode testing (minimum RM 0.50 order)

### 13.8 Deployment Portability

**Current deployment:** Manus-managed hosting with automatic builds, SSL, and domain management.

**Self-hosted deployment options:**

| Platform | Configuration |
|----------|--------------|
| VPS (DigitalOcean, Linode, Hetzner) | `pnpm build && pnpm start` behind Nginx/Caddy reverse proxy |
| Docker | Dockerfile with multi-stage build (Node 22 base, build stage, production stage) |
| Railway | Connect GitHub repo, set env vars, auto-deploy on push |
| Render | Web service with `pnpm build` build command and `pnpm start` start command |
| AWS ECS / Fargate | Docker container with ALB for load balancing |
| Fly.io | `fly launch` with Dockerfile, set secrets via `fly secrets set` |

**Build commands:**

```bash
# Install dependencies
pnpm install

# Build frontend (Vite) + backend (esbuild)
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
```

The production server serves the Vite-built static files from `dist/` and handles all API routes. No separate frontend deployment is needed — it is a single-process application.

### 13.9 Self-Hosting Environment Variable Template

```bash
# === REQUIRED ===
DATABASE_URL=mysql://user:password@host:3306/fake_by_freetown?ssl={"rejectUnauthorized":true}
JWT_SECRET=your-256-bit-random-secret-here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# === STORAGE (choose one) ===
# Option A: AWS S3
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=wJal...
S3_BUCKET=fake-by-freetown-assets

# Option B: Cloudflare R2
S3_REGION=auto
S3_ACCESS_KEY_ID=your-r2-access-key
S3_SECRET_ACCESS_KEY=your-r2-secret-key
S3_BUCKET=fake-by-freetown-assets
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# === OPTIONAL: LLM ===
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-...

# === OPTIONAL: Notifications ===
SENDGRID_API_KEY=SG...
ADMIN_EMAIL=owner@getfakenow.com

# === APP CONFIG ===
VITE_APP_TITLE=Fake by Freetown
VITE_APP_LOGO=https://your-cdn.com/logo.svg
NODE_ENV=production
PORT=3000
```

### 13.10 Portability Checklist

| Step | Action | Estimated Time |
|------|--------|---------------|
| 1 | Export code from Manus (Settings > GitHub) | 2 minutes |
| 2 | Provision MySQL database (PlanetScale, AWS RDS, or local) | 10 minutes |
| 3 | Run `pnpm db:push` to create schema on new database | 1 minute |
| 4 | Provision S3 bucket (AWS, R2, or MinIO) | 5 minutes |
| 5 | Replace `server/storage.ts` with direct S3 SDK calls | 15 minutes |
| 6 | Remove Manus OAuth from `context.ts` and `sdk.ts` | 10 minutes |
| 7 | Update `cookies.ts` to use `sameSite: 'lax'` | 1 minute |
| 8 | Replace `notification.ts` with email/Slack integration | 10 minutes |
| 9 | Set all environment variables on new host | 5 minutes |
| 10 | Run `pnpm build && pnpm start` | 2 minutes |
| 11 | Update Stripe webhook URL to new domain | 2 minutes |
| 12 | Configure DNS and SSL (Caddy auto-SSL or Let's Encrypt) | 10 minutes |

**Total estimated migration time: approximately 1 hour** for a developer familiar with the stack.

---

## 14. Operations Bot: Automated Code Review, Monitoring, and Improvement

This section defines an automated operations bot that continuously reviews, monitors, and improves the codebase and runtime environment. The bot operates as a scheduled background process within the Seller Center, accessible to admins at `/admin/operations`.

### 14.1 Bot Architecture

The operations bot is a server-side module that runs on a configurable schedule (default: daily at 02:00 UTC). It performs automated audits across four domains: **Code Quality**, **Security**, **Performance**, and **Business Health**. Results are stored in a new `auditReports` table and surfaced in the admin dashboard.

```
Scheduler (cron or interval)
      |
+-----+-----+-----+-----+
|     |     |     |     |
Code  Security  Perf  Business
Audit  Audit   Audit  Audit
|     |     |     |     |
+-----+-----+-----+-----+
      |
  auditReports table
      |
  Admin Dashboard (/admin/operations)
```

### 14.2 Code Quality Audits

The code quality module analyzes the codebase for structural issues, anti-patterns, and maintainability concerns.

| Check | What It Does | Severity |
|-------|-------------|----------|
| Unused Exports | Scans for exported functions/types never imported elsewhere | Warning |
| Large Files | Flags files exceeding 300 lines (routers, components) | Warning |
| Missing Error Handling | Detects `async` functions without try/catch or `.catch()` | Error |
| Hardcoded Values | Finds magic numbers, hardcoded URLs, or inline credentials | Error |
| Missing Zod Validation | Identifies tRPC procedures without input validation | Error |
| Duplicate Code | Detects similar code blocks across files (>20 lines) | Warning |
| Missing TypeScript Types | Finds `any` type usage or missing return types | Warning |
| Test Coverage Gaps | Identifies procedures without corresponding test files | Warning |

**Implementation approach:** The bot uses the LLM integration (`invokeLLM`) to analyze code files. It reads the source files from the project directory, sends them to the LLM with a structured prompt requesting JSON-formatted findings, and parses the response into audit records.

### 14.3 Security Audits

The security module checks for vulnerabilities and compliance issues.

| Check | What It Does | Severity |
|-------|-------------|----------|
| Dependency Vulnerabilities | Runs `pnpm audit` and parses results | Critical/High |
| Exposed Secrets | Scans code for patterns matching API keys, tokens, passwords | Critical |
| Missing Auth Guards | Verifies all admin routes use `adminProcedure` | Critical |
| Outdated Dependencies | Checks for packages with known CVEs | High |
| Cookie Security | Validates cookie attributes (httpOnly, secure, sameSite) | High |
| HTTPS Enforcement | Verifies all external API calls use HTTPS | Medium |
| Input Sanitization | Checks for unsanitized user input in database queries | High |
| File Upload Validation | Verifies file type and size checks on upload endpoints | Medium |

### 14.4 Performance Audits

The performance module monitors runtime metrics and identifies bottlenecks.

| Check | What It Does | Severity |
|-------|-------------|----------|
| Slow Queries | Logs database queries exceeding 500ms | Warning |
| N+1 Query Detection | Identifies loops that make individual DB calls | Warning |
| Bundle Size | Checks frontend build output for oversized chunks | Warning |
| Image Optimization | Flags product images exceeding 500KB | Warning |
| Memory Usage | Monitors Node.js heap size trends | Warning |
| API Response Times | Tracks p50/p95/p99 latency for tRPC procedures | Info |
| Cache Hit Rates | Monitors TanStack Query cache effectiveness | Info |

### 14.5 Business Health Audits

The business health module monitors operational metrics that indicate store health.

| Check | What It Does | Severity |
|-------|-------------|----------|
| Out-of-Stock Products | Lists products with zero inventory | Warning |
| Stale Orders | Flags orders stuck in "processing" for >48 hours | Warning |
| Failed Payments | Counts payment failures in the last 24 hours | Warning |
| Abandoned Carts | Counts cart items older than 7 days | Info |
| Price Anomalies | Detects products priced at 0 or significantly below category average | Warning |
| Missing Product Images | Lists products without a primary image | Warning |
| Inactive Products | Lists products marked inactive for >30 days | Info |
| Customer Registration Trend | Compares this week's registrations to last week | Info |

### 14.6 Audit Report Schema

```sql
CREATE TABLE auditReports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  runId VARCHAR(64) NOT NULL,          -- Groups findings from a single run
  domain ENUM('code', 'security', 'performance', 'business') NOT NULL,
  checkName VARCHAR(100) NOT NULL,     -- e.g., 'missing_auth_guards'
  severity ENUM('critical', 'high', 'medium', 'warning', 'info') NOT NULL,
  title VARCHAR(255) NOT NULL,         -- Human-readable finding title
  description TEXT NOT NULL,           -- Detailed explanation
  filePath VARCHAR(500),               -- Affected file (for code/security)
  lineNumber INT,                      -- Affected line (for code/security)
  suggestion TEXT,                     -- Recommended fix
  autoFixable BOOLEAN DEFAULT false,   -- Whether the bot can auto-fix
  status ENUM('open', 'acknowledged', 'fixed', 'dismissed') DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### 14.7 Auto-Fix Capabilities

For certain findings, the bot can apply fixes automatically (with admin approval):

| Finding | Auto-Fix Action | Requires Approval |
|---------|----------------|-------------------|
| Missing Zod validation | Generate Zod schema from TypeScript types | Yes |
| Outdated dependencies | Run `pnpm update` for non-breaking updates | Yes |
| Missing error handling | Wrap async functions in try/catch | Yes |
| Out-of-stock products | Set `active = false` to hide from storefront | Yes |
| Stale processing orders | Send notification to admin with order details | No |
| Large image files | Compress and re-upload to S3 | Yes |

Auto-fixes are proposed as diffs in the admin UI. The admin reviews and approves or dismisses each fix. Approved fixes are applied and logged in the `activityLog` table.

### 14.8 Operations Dashboard UI

**Route:** `/admin/operations`

**Summary Cards:**

| Card | Content |
|------|---------|
| Overall Health Score | 0-100 based on weighted audit findings |
| Critical Issues | Count of critical/high severity open findings |
| Last Audit Run | Timestamp and duration of most recent run |
| Auto-Fix Queue | Number of pending auto-fix proposals |

**Findings Table:** Filterable by domain, severity, and status. Each row shows the finding title, severity badge, affected file, and action buttons (Acknowledge, Fix, Dismiss).

**Trend Chart:** Line chart showing health score over the last 30 days, with markers for when fixes were applied.

### 14.9 Notification Integration

The operations bot uses the existing `notifyOwner()` helper to alert the admin when critical issues are detected. Notification triggers:

| Trigger | Channel | Frequency |
|---------|---------|-----------|
| Critical security finding | Push notification | Immediate |
| Health score drops below 70 | Push notification | Once per day |
| 3+ out-of-stock products | Push notification | Once per day |
| Stale order (>48h in processing) | Push notification | Every 12 hours |
| Dependency vulnerability (critical) | Push notification | Immediate |

---

---

## 16. Email System

The email system handles all transactional and marketing communications. It is built as a modular service layer that abstracts the email provider, allowing the platform to switch between providers (SendGrid, Resend, AWS SES, Mailgun) without changing application logic.

### 16.1 Architecture

The email service is implemented as a server-side module (`server/email.ts`) with a provider-agnostic interface. All emails are rendered from HTML templates stored in the database (`emailTemplates` table), allowing admins to edit subject lines, body content, and styling without code changes.

| Component | Location | Purpose |
|-----------|----------|---------|
| Email Service | `server/email.ts` | Provider abstraction, send/queue logic |
| Template Engine | `server/emailTemplates.ts` | Variable interpolation, HTML rendering |
| Template Storage | `emailTemplates` table | Admin-editable templates |
| Send Log | `emailLog` table | Delivery tracking, audit trail |
| Queue | `emailQueue` table | Async send with retry logic |

### 16.2 Transactional Emails

Transactional emails are triggered automatically by system events. They are high-priority and sent immediately (not queued).

| Trigger Event | Template Key | Variables | Description |
|---------------|-------------|-----------|-------------|
| `auth.register` | `welcome` | `{{name}}`, `{{email}}`, `{{loginUrl}}` | Welcome email after registration |
| `checkout.session.completed` | `order_confirmation` | `{{orderNumber}}`, `{{items}}`, `{{total}}`, `{{shippingAddress}}`, `{{estimatedDelivery}}` | Order receipt with line items |
| `admin.orders.updateStatus` → `shipped` | `order_shipped` | `{{orderNumber}}`, `{{trackingNumber}}`, `{{trackingUrl}}`, `{{carrierName}}` | Shipping notification with tracking link |
| `admin.orders.updateStatus` → `delivered` | `order_delivered` | `{{orderNumber}}`, `{{reviewUrl}}` | Delivery confirmation with review prompt |
| `admin.orders.updateStatus` → `cancelled` | `order_cancelled` | `{{orderNumber}}`, `{{reason}}`, `{{refundAmount}}` | Cancellation notice with refund details |
| `auth.requestPasswordReset` | `password_reset` | `{{name}}`, `{{resetUrl}}`, `{{expiresIn}}` | Password reset link (1hr TTL) |
| Stripe `payment_intent.payment_failed` | `payment_failed` | `{{orderNumber}}`, `{{retryUrl}}` | Payment failure with retry link |

### 16.3 Marketing Emails (Broadcast)

Marketing emails are sent through the broadcast system (Section 17) and queued for batch delivery to avoid rate limits. They support audience segmentation and A/B testing of subject lines.

| Campaign Type | Audience | Use Case |
|---------------|----------|----------|
| Product Launch | All subscribers | New product or collection announcement |
| Flash Sale | All subscribers or segment | Time-limited discount promotion |
| Re-engagement | Users with no order in 60+ days | Win-back campaign with incentive |
| Seasonal | All subscribers | Holiday or seasonal promotions |
| Post-Purchase | Recent buyers (7-14 days) | Cross-sell, review request, care instructions |

### 16.4 Email Template Management

**Route:** `/admin/email/templates`

Admins can view, edit, and preview all email templates from the Seller Center. Each template uses a simple variable interpolation system (`{{variableName}}`) and supports HTML with inline CSS for maximum email client compatibility.

| Field | Type | Description |
|-------|------|-------------|
| `key` | VARCHAR(100) UNIQUE | Template identifier (e.g., `order_confirmation`) |
| `name` | VARCHAR(255) | Human-readable name |
| `subject` | VARCHAR(500) | Email subject line (supports variables) |
| `htmlBody` | TEXT | Full HTML email body |
| `textBody` | TEXT | Plain text fallback |
| `category` | ENUM | `transactional`, `marketing`, `system` |
| `active` | BOOLEAN | Enable/disable |
| `updatedAt` | TIMESTAMP | Last edit timestamp |

The template editor provides a split-pane view: raw HTML on the left, live preview on the right. A "Send Test" button sends the rendered template to the admin's email for verification before going live.

### 16.5 Email Analytics

| Metric | Source | Description |
|--------|--------|-------------|
| Sent | `emailLog` count | Total emails dispatched |
| Delivered | Provider webhook | Successfully received by mail server |
| Opened | Tracking pixel | Recipient opened the email |
| Clicked | Link tracking | Recipient clicked a link |
| Bounced | Provider webhook | Hard/soft bounce |
| Unsubscribed | Unsubscribe link | Recipient opted out |

**Route:** `/admin/email/analytics` — Dashboard showing send volume, open rates, click rates, and bounce rates over time with per-template breakdown.

---

## 17. Broadcast & Messaging System

The broadcast system provides multi-channel customer communication across **Email**, **WhatsApp Business**, and **Facebook Messenger**. It serves as the unified messaging hub for marketing campaigns, order notifications, and customer engagement.

### 17.1 Channel Architecture

| Channel | Provider | API | Use Cases |
|---------|----------|-----|-----------|
| Email | SendGrid / Resend / AWS SES | REST API | Transactional, marketing, cart recovery |
| WhatsApp | WhatsApp Business API (Meta Cloud API) | Graph API v19.0 | Order updates, cart recovery, promotions |
| Facebook Messenger | Meta Messenger Platform | Graph API v19.0 | Customer support, automated responses |

All channels are managed through a unified `messagingService` abstraction (`server/messaging.ts`) that normalizes the send interface across providers. Messages are logged in the `messageLog` table regardless of channel.

### 17.2 WhatsApp Business Integration

WhatsApp Business API is accessed through Meta's Cloud API. The integration requires a Meta Business account, a verified WhatsApp Business phone number, and approval for message templates.

**Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API permanent access token |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Business account for template management |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook verification token |

**Message Types:**

| Type | Description | Requires Template Approval |
|------|-------------|---------------------------|
| Template Messages | Pre-approved structured messages (order updates, shipping, promotions) | Yes |
| Session Messages | Free-form replies within 24hr customer-initiated window | No |
| Interactive Messages | Buttons, lists, product catalogs | Yes (for business-initiated) |

**WhatsApp Message Templates (to be submitted for Meta approval):**

| Template Name | Category | Variables | Trigger |
|---------------|----------|-----------|---------|
| `order_confirmation` | UTILITY | `{{orderNumber}}`, `{{total}}`, `{{itemCount}}` | Order placed |
| `order_shipped` | UTILITY | `{{orderNumber}}`, `{{trackingNumber}}`, `{{trackingUrl}}` | Status → shipped |
| `order_delivered` | UTILITY | `{{orderNumber}}` | Status → delivered |
| `cart_recovery` | MARKETING | `{{customerName}}`, `{{itemCount}}`, `{{cartUrl}}` | Cart abandoned 1hr+ |
| `flash_sale` | MARKETING | `{{discountPercent}}`, `{{expiryDate}}`, `{{shopUrl}}` | Admin-triggered campaign |
| `welcome` | MARKETING | `{{customerName}}`, `{{shopUrl}}` | New registration |

**Webhook Endpoint:** `POST /api/webhooks/whatsapp`

Handles incoming messages, delivery status updates, and read receipts. Incoming customer messages are logged and can trigger automated responses or be routed to the admin for manual reply.

### 17.3 Facebook Messenger Integration

Facebook Messenger integration enables automated customer support and proactive messaging through the Meta Messenger Platform.

**Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `FB_PAGE_ACCESS_TOKEN` | Facebook Page long-lived access token |
| `FB_APP_SECRET` | App secret for webhook signature verification |
| `FB_PAGE_ID` | Facebook Page ID |
| `FB_WEBHOOK_VERIFY_TOKEN` | Webhook verification token |

**Capabilities:**

| Feature | Description |
|---------|-------------|
| Welcome Message | Automated greeting when customer opens Messenger |
| Persistent Menu | Quick-access buttons: Track Order, Browse Products, Contact Support |
| Order Lookup | Customer sends order number, bot returns status and tracking |
| FAQ Bot | Automated responses to common questions (shipping times, return policy, size guide) |
| Live Handoff | Escalate to human admin when bot cannot resolve |
| Broadcast Messages | Send approved marketing messages to opted-in subscribers |

**Webhook Endpoint:** `POST /api/webhooks/messenger`

Processes incoming messages, postbacks (button clicks), and delivery confirmations. The webhook handler routes messages through a simple intent-detection pipeline before falling back to the admin notification system.

### 17.4 Broadcast Campaign Management

**Route:** `/admin/messaging/campaigns`

The campaign manager allows admins to create, schedule, and track multi-channel broadcast campaigns.

**Campaign Creation Form:**

| Field | Type | Description |
|-------|------|-------------|
| Campaign Name | Text | Internal reference name |
| Channels | Multi-select | Email, WhatsApp, Messenger (one or more) |
| Audience | Segment selector | All customers, recent buyers, inactive, custom segment |
| Email Template | Dropdown | Select from `emailTemplates` |
| WhatsApp Template | Dropdown | Select from approved templates |
| Messenger Content | Rich text | Message body for Messenger |
| Schedule | DateTime / Immediate | When to send |
| A/B Test | Toggle | Split audience for subject line testing (email only) |

**Audience Segments:**

| Segment | Definition |
|---------|-----------|
| All Customers | All users with `role = 'user'` and valid contact info |
| Recent Buyers | Users with a paid order in the last 30 days |
| Inactive | Users with no order in 60+ days |
| High Value | Users with lifetime spend > RM 500 |
| New Customers | Users registered in the last 14 days |
| Cart Abandoners | Users with active cart items and no order in 24hrs |
| Custom | Admin-defined filter (date range, category purchased, location) |

**Campaign Analytics:**

| Metric | Email | WhatsApp | Messenger |
|--------|-------|----------|-----------|
| Sent | Count of emails dispatched | Count of messages sent | Count of messages sent |
| Delivered | Provider confirmation | Blue single check | Delivered receipt |
| Read/Opened | Tracking pixel | Blue double check | Read receipt |
| Clicked | Link tracking | Link tracking | Postback tracking |
| Replied | N/A | Customer response count | Customer response count |
| Unsubscribed | Unsubscribe link | Opt-out response | Block/report |

### 17.5 Unified Message Log

All outbound messages across all channels are logged in the `messageLog` table for audit, analytics, and customer history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Log entry ID |
| `channel` | ENUM(`'email'`, `'whatsapp'`, `'messenger'`) | Delivery channel |
| `recipientId` | INT | FK to users |
| `recipientContact` | VARCHAR(320) | Email address or phone number |
| `templateKey` | VARCHAR(100) | Template used |
| `subject` | VARCHAR(500) | Email subject (null for non-email) |
| `status` | ENUM(`'queued'`, `'sent'`, `'delivered'`, `'read'`, `'failed'`, `'bounced'`) | Delivery status |
| `campaignId` | INT nullable | FK to campaigns (null for transactional) |
| `metadata` | TEXT | JSON payload (provider message ID, error details) |
| `sentAt` | TIMESTAMP | When the message was dispatched |
| `deliveredAt` | TIMESTAMP nullable | When delivery was confirmed |
| `readAt` | TIMESTAMP nullable | When the message was read/opened |
| `createdAt` | TIMESTAMP | Record creation |

---

## 18. Cart Recovery System

Cart abandonment is the single largest source of lost revenue in e-commerce. The cart recovery system automatically detects abandoned carts and triggers multi-channel recovery sequences to bring customers back.

### 18.1 Abandonment Detection

A cart is considered "abandoned" when a logged-in user has items in their `cartItems` table but has not completed checkout within a configurable time window (default: 1 hour). Detection runs on a scheduled job (every 15 minutes) that queries for qualifying carts.

**Detection Query Logic:**

```
SELECT users.id, users.email, users.name, COUNT(cartItems.id) as itemCount,
       SUM(products.price * cartItems.quantity) as cartValue
FROM cartItems
JOIN users ON cartItems.userId = users.id
JOIN products ON cartItems.productId = products.id
WHERE cartItems.updatedAt < NOW() - INTERVAL 1 HOUR
  AND users.id NOT IN (
    SELECT userId FROM orders
    WHERE createdAt > cartItems.updatedAt
  )
  AND users.id NOT IN (
    SELECT recipientId FROM messageLog
    WHERE templateKey = 'cart_recovery'
    AND sentAt > NOW() - INTERVAL 24 HOUR
  )
GROUP BY users.id
```

### 18.2 Recovery Sequence

The recovery sequence is a timed series of messages across channels, designed to escalate urgency without being intrusive.

| Step | Timing | Channel | Template | Content Strategy |
|------|--------|---------|----------|-----------------|
| 1 | 1 hour after abandonment | Email | `cart_recovery_1` | Gentle reminder: "You left something behind" with cart contents |
| 2 | 4 hours after abandonment | WhatsApp | `cart_recovery` | Short message with item count and direct cart link |
| 3 | 24 hours after abandonment | Email | `cart_recovery_2` | Urgency: "Items selling fast" with stock levels |
| 4 | 48 hours after abandonment | Email | `cart_recovery_3` | Incentive: Limited-time discount code (e.g., 10% off) |

Each step checks whether the customer has since completed a purchase before sending. If the customer converts at any step, the remaining sequence is cancelled.

### 18.3 Recovery Analytics

**Route:** `/admin/marketing/cart-recovery`

| Metric | Calculation |
|--------|------------|
| Carts Abandoned (period) | Count of detected abandonments |
| Recovery Emails Sent | Count of cart recovery messages |
| Recovered Carts | Orders placed after receiving recovery message |
| Recovery Rate | Recovered / Abandoned |
| Revenue Recovered | Total value of recovered orders |
| Average Recovery Time | Mean time from first message to conversion |

### 18.4 Admin Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Cart Recovery | Toggle | On | Master switch |
| Abandonment Threshold | Minutes | 60 | Time before cart is considered abandoned |
| Max Recovery Attempts | Number | 4 | Maximum messages per abandoned cart |
| Recovery Discount Code | Text | Auto-generated | Discount code for step 4 |
| Recovery Discount Value | Number | 10% | Discount percentage |
| Channels Enabled | Multi-select | Email, WhatsApp | Which channels to use |

---

## 19. CMS & Page Management

The Content Management System allows admins to control storefront content — homepage banners, promotional sections, static pages, and navigation — without code changes or deployments.

### 19.1 Architecture

The CMS is built on a **content blocks** model. Each page is composed of ordered content blocks that can be rearranged, edited, enabled, or disabled independently. Content is stored in the database and fetched by the storefront at render time.

| Component | Location | Purpose |
|-----------|----------|---------|
| Content Blocks | `contentBlocks` table | Structured page content |
| Banner Slides | `bannerSlides` table | Homepage hero carousel |
| Static Pages | `staticPages` table | About, FAQ, policies (admin-editable) |
| Navigation | `navigationItems` table | Header/footer link management |
| Media Library | S3 + `mediaLibrary` table | Centralized image/asset management |

### 19.2 Banner / Hero Slide Management

**Route:** `/admin/cms/banners`

The homepage hero section is powered by a carousel of banner slides, each with its own image, headline, subtext, CTA button, and link. Admins can add, edit, reorder, and schedule banners.

**Banner Slide Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT PK | Slide ID |
| `title` | VARCHAR(255) | Headline text |
| `subtitle` | TEXT | Supporting text |
| `imageUrl` | TEXT | Background image (S3) |
| `mobileImageUrl` | TEXT nullable | Mobile-optimized image |
| `ctaText` | VARCHAR(100) | Button label (e.g., "SHOP NOW") |
| `ctaLink` | VARCHAR(500) | Button destination URL |
| `textColor` | VARCHAR(20) | Text color (hex or class) |
| `overlayOpacity` | INT | Background overlay darkness (0-100) |
| `sortOrder` | INT | Display order |
| `startDate` | TIMESTAMP nullable | Scheduled start (null = always) |
| `endDate` | TIMESTAMP nullable | Scheduled end (null = forever) |
| `active` | BOOLEAN | Enable/disable |
| `createdAt` | TIMESTAMP | Creation date |

**Admin UI Features:**
- Drag-and-drop reordering of slides
- Live preview of each slide with desktop and mobile views
- Schedule banners for future campaigns (e.g., holiday sales)
- Upload images directly to S3 from the banner editor
- Set overlay opacity and text color per slide for readability

### 19.3 Content Block System

**Route:** `/admin/cms/pages/:pageKey/blocks`

Content blocks are modular sections that compose a page. Each block has a type that determines its rendering component on the storefront.

**Block Types:**

| Type | Description | Fields |
|------|-------------|--------|
| `hero` | Full-width hero with image, text, CTA | title, subtitle, imageUrl, ctaText, ctaLink |
| `product_grid` | Grid of featured products | title, productIds (JSON array), columns (2/3/4) |
| `category_showcase` | Category cards with images | title, categoryIds (JSON array) |
| `text_section` | Rich text content block | title, body (HTML) |
| `image_banner` | Full-width promotional image | imageUrl, link, altText |
| `testimonials` | Customer testimonial carousel | title, testimonials (JSON array) |
| `newsletter` | Email signup form | title, subtitle, buttonText |
| `size_promise` | Brand promise section | title, body |
| `split_content` | Two-column text + image layout | title, body, imageUrl, imagePosition (left/right) |
| `video` | Embedded video section | title, videoUrl, posterImage |

**Content Block Table:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Block ID |
| `pageKey` | VARCHAR(100) | Page identifier (e.g., `home`, `about`) |
| `blockType` | VARCHAR(50) | Block type from the list above |
| `title` | VARCHAR(255) nullable | Section heading |
| `content` | TEXT | JSON payload specific to block type |
| `sortOrder` | INT | Display order within the page |
| `active` | BOOLEAN | Enable/disable |
| `createdAt` | TIMESTAMP | Creation |
| `updatedAt` | TIMESTAMP | Last edit |

### 19.4 Static Page Editor

**Route:** `/admin/cms/pages`

Admins can edit the content of static pages (About, Privacy Policy, Shipping Policy, Returns Policy, Terms of Service, FAQ) through a rich text editor. Changes are saved to the `staticPages` table and rendered on the storefront.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT PK | Page ID |
| `key` | VARCHAR(100) UNIQUE | URL slug (e.g., `about`, `privacy-policy`) |
| `title` | VARCHAR(255) | Page title |
| `body` | TEXT | HTML content |
| `metaTitle` | VARCHAR(255) | SEO title tag |
| `metaDescription` | TEXT | SEO meta description |
| `published` | BOOLEAN | Show/hide on storefront |
| `updatedAt` | TIMESTAMP | Last edit |

### 19.5 Navigation Management

**Route:** `/admin/cms/navigation`

Admins can manage header and footer navigation links without code changes.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT PK | Item ID |
| `location` | ENUM(`'header'`, `'footer'`, `'mobile'`) | Where the link appears |
| `label` | VARCHAR(100) | Display text |
| `url` | VARCHAR(500) | Link destination |
| `sortOrder` | INT | Display order |
| `parentId` | INT nullable | For dropdown menus |
| `active` | BOOLEAN | Enable/disable |

### 19.6 Media Library

**Route:** `/admin/cms/media`

A centralized asset manager for all images, videos, and files used across the site. All uploads go through S3 with metadata tracked in the database.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT PK | Asset ID |
| `fileName` | VARCHAR(255) | Original file name |
| `fileKey` | TEXT | S3 storage key |
| `url` | TEXT | Public CDN URL |
| `mimeType` | VARCHAR(100) | File MIME type |
| `fileSize` | INT | Size in bytes |
| `width` | INT nullable | Image width (pixels) |
| `height` | INT nullable | Image height (pixels) |
| `altText` | VARCHAR(500) | Accessibility alt text |
| `tags` | TEXT | Comma-separated tags for search |
| `uploadedBy` | INT | FK to users (admin) |
| `createdAt` | TIMESTAMP | Upload date |

---

## 20. SEO Management

Search Engine Optimization is managed through a combination of automated technical SEO, admin-configurable meta data, and structured data markup. The goal is to ensure every page on the storefront is discoverable, correctly indexed, and rich-result eligible.

### 20.1 Technical SEO (Automated)

These features are built into the storefront and require no admin configuration.

| Feature | Implementation | Description |
|---------|---------------|-------------|
| Semantic HTML | React components | Proper heading hierarchy (h1-h6), landmark elements |
| Canonical URLs | `<link rel="canonical">` on every page | Prevents duplicate content issues |
| Open Graph Tags | Dynamic `<meta>` tags | Facebook/LinkedIn sharing previews |
| Twitter Cards | Dynamic `<meta name="twitter:*">` | Twitter sharing previews |
| Robots.txt | `client/public/robots.txt` | Crawl directives |
| Sitemap.xml | Server-generated `/sitemap.xml` | Dynamic sitemap from products, categories, pages |
| Structured Data (JSON-LD) | Injected `<script type="application/ld+json">` | Product, Organization, BreadcrumbList schemas |
| Image Alt Text | From product name + color | Accessibility and image search |
| Clean URLs | Slug-based routing (`/product/:slug`) | Human-readable, keyword-rich URLs |
| Page Speed | Lazy loading, image optimization, code splitting | Core Web Vitals compliance |

### 20.2 Sitemap Generation

The sitemap is dynamically generated at `/sitemap.xml` by a server endpoint that queries the database for all active products, categories, and published pages.

**Sitemap Structure:**

| URL Pattern | Priority | Change Frequency | Source |
|-------------|----------|-----------------|--------|
| `/` | 1.0 | daily | Static |
| `/shop` | 0.9 | daily | Static |
| `/shop?category={slug}` | 0.8 | daily | `categories` table |
| `/product/{slug}` | 0.7 | weekly | `products` table (active only) |
| `/about` | 0.5 | monthly | Static |
| `/{policy-page}` | 0.3 | monthly | `staticPages` table |

### 20.3 Structured Data (JSON-LD)

Structured data is automatically injected into product pages, the homepage, and category pages to enable Google rich results.

**Product Page Schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "The OG — You Fake Bro? Tee",
  "description": "...",
  "image": "https://cdn.example.com/product.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Fake by Freetown"
  },
  "offers": {
    "@type": "Offer",
    "price": "59.00",
    "priceCurrency": "MYR",
    "availability": "https://schema.org/InStock",
    "url": "https://getfakenow.com/product/you-fake-bro-tee"
  }
}
```

**Organization Schema (Homepage):**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Fake by Freetown",
  "url": "https://getfakenow.com",
  "logo": "https://cdn.example.com/logo.png",
  "sameAs": [
    "https://instagram.com/fakebyfreetown",
    "https://tiktok.com/@fakebyfreetown"
  ]
}
```

### 20.4 Admin SEO Controls

**Route:** `/admin/seo`

The SEO management page gives admins control over per-page meta data, global SEO settings, and keyword monitoring.

#### 20.4.1 Global SEO Settings

| Setting | Type | Description |
|---------|------|-------------|
| Site Title Template | Text | Pattern for `<title>` tags (e.g., `{{pageTitle}} | Fake by Freetown`) |
| Default Meta Description | Text | Fallback description for pages without custom meta |
| Google Analytics ID | Text | GA4 measurement ID |
| Google Search Console Verification | Text | Site verification meta tag |
| Facebook Pixel ID | Text | Facebook tracking pixel |
| Social Share Default Image | File upload | Default OG image when page has no image |

#### 20.4.2 Per-Page SEO

Each product, category, and static page has editable SEO fields:

| Field | Type | Max Length | Description |
|-------|------|-----------|-------------|
| Meta Title | Text | 60 chars | Custom `<title>` tag (overrides default) |
| Meta Description | Text | 160 chars | Custom meta description |
| Focus Keyword | Text | — | Primary keyword for content optimization |
| OG Title | Text | — | Open Graph title (defaults to meta title) |
| OG Description | Text | — | Open Graph description |
| OG Image | File | — | Social sharing image |
| No Index | Toggle | — | Exclude from search engine indexing |
| Canonical URL | Text | — | Custom canonical (defaults to page URL) |

#### 20.4.3 SEO Audit Dashboard

The SEO audit runs automatically and flags issues across the site.

| Check | Severity | Description |
|-------|----------|-------------|
| Missing meta title | High | Pages without a custom or generated title |
| Missing meta description | High | Pages without a meta description |
| Duplicate meta titles | Medium | Two or more pages sharing the same title |
| Missing alt text | Medium | Product images without alt attributes |
| Broken internal links | High | Links pointing to 404 pages |
| Missing structured data | Medium | Product pages without JSON-LD |
| Slow pages | Low | Pages exceeding Core Web Vitals thresholds |
| Missing OG image | Low | Pages without social sharing images |
| Title too long (>60 chars) | Low | Titles that may be truncated in search results |
| Description too long (>160 chars) | Low | Descriptions that may be truncated |

#### 20.4.4 Redirect Management

**Route:** `/admin/seo/redirects`

Manage 301/302 redirects for renamed products, removed pages, or URL structure changes.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT PK | Redirect ID |
| `fromPath` | VARCHAR(500) UNIQUE | Source URL path |
| `toPath` | VARCHAR(500) | Destination URL path |
| `type` | ENUM(`'301'`, `'302'`) | Permanent or temporary |
| `active` | BOOLEAN | Enable/disable |
| `hitCount` | INT | Number of times triggered |
| `createdAt` | TIMESTAMP | Creation date |

---

## 21. Updated Schema Requirements

The following additional tables are required to support the Email, Broadcast, Cart Recovery, CMS, and SEO modules.

### 21.1 Email & Messaging Tables

#### `emailTemplates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Template ID |
| `key` | VARCHAR(100) UNIQUE | Template identifier |
| `name` | VARCHAR(255) | Display name |
| `subject` | VARCHAR(500) | Subject line (supports `{{variables}}`) |
| `htmlBody` | TEXT | HTML email body |
| `textBody` | TEXT | Plain text fallback |
| `category` | ENUM(`'transactional'`, `'marketing'`, `'system'`) | Template category |
| `active` | BOOLEAN default true | Enable/disable |
| `createdAt` | TIMESTAMP | Creation |
| `updatedAt` | TIMESTAMP | Last edit |

#### `emailQueue`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Queue entry ID |
| `recipientEmail` | VARCHAR(320) | Destination email |
| `recipientId` | INT nullable | FK to users |
| `templateKey` | VARCHAR(100) | Template to render |
| `variables` | TEXT | JSON object of template variables |
| `priority` | ENUM(`'high'`, `'normal'`, `'low'`) | Send priority |
| `status` | ENUM(`'queued'`, `'sending'`, `'sent'`, `'failed'`) | Queue status |
| `attempts` | INT default 0 | Retry count |
| `maxAttempts` | INT default 3 | Max retries |
| `scheduledAt` | TIMESTAMP | When to send |
| `sentAt` | TIMESTAMP nullable | When sent |
| `error` | TEXT nullable | Last error message |
| `createdAt` | TIMESTAMP | Queued at |

#### `messageLog`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Log entry ID |
| `channel` | ENUM(`'email'`, `'whatsapp'`, `'messenger'`) | Channel |
| `recipientId` | INT nullable | FK to users |
| `recipientContact` | VARCHAR(320) | Email/phone |
| `templateKey` | VARCHAR(100) | Template used |
| `subject` | VARCHAR(500) nullable | Email subject |
| `status` | ENUM(`'queued'`, `'sent'`, `'delivered'`, `'read'`, `'failed'`, `'bounced'`) | Status |
| `campaignId` | INT nullable | FK to campaigns |
| `metadata` | TEXT | JSON (provider ID, errors) |
| `sentAt` | TIMESTAMP nullable | Dispatch time |
| `deliveredAt` | TIMESTAMP nullable | Delivery confirmation |
| `readAt` | TIMESTAMP nullable | Read/open time |
| `createdAt` | TIMESTAMP | Record creation |

#### `campaigns`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Campaign ID |
| `name` | VARCHAR(255) | Campaign name |
| `channels` | VARCHAR(100) | Comma-separated: `email,whatsapp,messenger` |
| `audienceSegment` | VARCHAR(100) | Target segment key |
| `emailTemplateId` | INT nullable | FK to emailTemplates |
| `whatsappTemplateKey` | VARCHAR(100) nullable | WhatsApp template name |
| `messengerContent` | TEXT nullable | Messenger message body |
| `status` | ENUM(`'draft'`, `'scheduled'`, `'sending'`, `'sent'`, `'cancelled'`) | Campaign status |
| `scheduledAt` | TIMESTAMP nullable | Scheduled send time |
| `sentAt` | TIMESTAMP nullable | Actual send time |
| `recipientCount` | INT default 0 | Total recipients |
| `sentCount` | INT default 0 | Successfully sent |
| `openedCount` | INT default 0 | Opened/read |
| `clickedCount` | INT default 0 | Clicked links |
| `createdBy` | INT | FK to users (admin) |
| `createdAt` | TIMESTAMP | Creation |
| `updatedAt` | TIMESTAMP | Last update |

### 21.2 CMS Tables

#### `bannerSlides`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Slide ID |
| `title` | VARCHAR(255) | Headline |
| `subtitle` | TEXT nullable | Supporting text |
| `imageUrl` | TEXT | Background image URL |
| `mobileImageUrl` | TEXT nullable | Mobile image |
| `ctaText` | VARCHAR(100) nullable | Button text |
| `ctaLink` | VARCHAR(500) nullable | Button link |
| `textColor` | VARCHAR(20) default `'#FFFFFF'` | Text color |
| `overlayOpacity` | INT default 40 | Overlay darkness (0-100) |
| `sortOrder` | INT default 0 | Display order |
| `startDate` | TIMESTAMP nullable | Scheduled start |
| `endDate` | TIMESTAMP nullable | Scheduled end |
| `active` | BOOLEAN default true | Enable/disable |
| `createdAt` | TIMESTAMP | Creation |

#### `contentBlocks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Block ID |
| `pageKey` | VARCHAR(100) | Page identifier |
| `blockType` | VARCHAR(50) | Block type |
| `title` | VARCHAR(255) nullable | Section heading |
| `content` | TEXT | JSON payload |
| `sortOrder` | INT default 0 | Display order |
| `active` | BOOLEAN default true | Enable/disable |
| `createdAt` | TIMESTAMP | Creation |
| `updatedAt` | TIMESTAMP | Last edit |

#### `staticPages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Page ID |
| `key` | VARCHAR(100) UNIQUE | URL slug |
| `title` | VARCHAR(255) | Page title |
| `body` | TEXT | HTML content |
| `metaTitle` | VARCHAR(255) nullable | SEO title |
| `metaDescription` | TEXT nullable | SEO description |
| `published` | BOOLEAN default true | Visibility |
| `updatedAt` | TIMESTAMP | Last edit |

#### `navigationItems`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Item ID |
| `location` | ENUM(`'header'`, `'footer'`, `'mobile'`) | Placement |
| `label` | VARCHAR(100) | Display text |
| `url` | VARCHAR(500) | Link URL |
| `sortOrder` | INT default 0 | Order |
| `parentId` | INT nullable | Dropdown parent |
| `active` | BOOLEAN default true | Enable/disable |

#### `mediaLibrary`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Asset ID |
| `fileName` | VARCHAR(255) | Original name |
| `fileKey` | TEXT | S3 key |
| `url` | TEXT | Public URL |
| `mimeType` | VARCHAR(100) | MIME type |
| `fileSize` | INT | Bytes |
| `width` | INT nullable | Image width |
| `height` | INT nullable | Image height |
| `altText` | VARCHAR(500) nullable | Alt text |
| `tags` | TEXT nullable | Search tags |
| `uploadedBy` | INT | FK to users |
| `createdAt` | TIMESTAMP | Upload date |

### 21.3 SEO Tables

#### `seoMeta`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Meta ID |
| `pageType` | ENUM(`'product'`, `'category'`, `'page'`, `'global'`) | Entity type |
| `entityId` | INT nullable | FK to entity (null for global) |
| `metaTitle` | VARCHAR(255) nullable | Custom title |
| `metaDescription` | TEXT nullable | Custom description |
| `focusKeyword` | VARCHAR(255) nullable | Target keyword |
| `ogTitle` | VARCHAR(255) nullable | OG title override |
| `ogDescription` | TEXT nullable | OG description override |
| `ogImage` | TEXT nullable | OG image URL |
| `noIndex` | BOOLEAN default false | Exclude from indexing |
| `canonicalUrl` | VARCHAR(500) nullable | Custom canonical |
| `updatedAt` | TIMESTAMP | Last edit |

#### `redirects`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Redirect ID |
| `fromPath` | VARCHAR(500) UNIQUE | Source path |
| `toPath` | VARCHAR(500) | Destination path |
| `type` | ENUM(`'301'`, `'302'`) | Redirect type |
| `active` | BOOLEAN default true | Enable/disable |
| `hitCount` | INT default 0 | Usage count |
| `createdAt` | TIMESTAMP | Creation |

---

## 22. Updated Seller Center Module Roadmap

| Module | Status | Priority | Phase |
|--------|--------|----------|-------|
| Dashboard (Homepage) | **To Build** | P0 — Critical | Phase 1 |
| Order Management | **Partially Built** | P0 — Critical | Phase 1 |
| Product Management | **Partially Built** | P0 — Critical | Phase 1 |
| Inventory Management | **To Build** | P0 — Critical | Phase 1 |
| Customer Management | **To Build** | P1 — High | Phase 1 |
| Sales Analytics | **To Build** | P1 — High | Phase 1 |
| CMS: Banner Management | **To Build** | P1 — High | Phase 1 |
| CMS: Content Blocks | **To Build** | P1 — High | Phase 1 |
| CMS: Static Pages | **To Build** | P1 — High | Phase 1 |
| CMS: Navigation | **To Build** | P2 — Medium | Phase 2 |
| CMS: Media Library | **To Build** | P2 — Medium | Phase 2 |
| SEO: Technical (automated) | **To Build** | P1 — High | Phase 1 |
| SEO: Per-Page Meta | **To Build** | P1 — High | Phase 1 |
| SEO: Sitemap Generation | **To Build** | P1 — High | Phase 1 |
| SEO: Structured Data | **To Build** | P1 — High | Phase 1 |
| SEO: Audit Dashboard | **To Build** | P2 — Medium | Phase 2 |
| SEO: Redirect Management | **To Build** | P2 — Medium | Phase 2 |
| Email: Transactional | **To Build** | P1 — High | Phase 1 |
| Email: Template Management | **To Build** | P1 — High | Phase 1 |
| Email: Analytics | **To Build** | P2 — Medium | Phase 2 |
| Broadcast: WhatsApp | **To Build** | P2 — Medium | Phase 2 |
| Broadcast: Messenger | **To Build** | P2 — Medium | Phase 2 |
| Broadcast: Campaign Manager | **To Build** | P2 — Medium | Phase 2 |
| Cart Recovery: Detection | **To Build** | P1 — High | Phase 1 |
| Cart Recovery: Email Sequence | **To Build** | P1 — High | Phase 1 |
| Cart Recovery: Multi-Channel | **To Build** | P2 — Medium | Phase 2 |
| Cart Recovery: Analytics | **To Build** | P2 — Medium | Phase 2 |
| Promotions & Discounts | **To Build** | P2 — Medium | Phase 2 |
| Shipping Settings | **To Build** | P2 — Medium | Phase 2 |
| Site Settings | **To Build** | P3 — Low | Phase 2 |
| Returns Management | **To Build** | P2 — Medium | Phase 2 |
| Refund Processing | **To Build** | P1 — High | Phase 1 |
| Product Analytics | **To Build** | P2 — Medium | Phase 2 |
| Customer Analytics | **To Build** | P2 — Medium | Phase 2 |
| Digital Products | **Schema Ready** | P3 — Low | Phase 3 |
| Content/Blog | **Schema Ready** | P3 — Low | Phase 3 |
| Operations Bot | **To Build** | P3 — Low | Phase 3 |

---

## 23. Appendix: Current Product Catalog

As of March 26, 2026, the store has **33 active products** across 5 categories.

| Category | Count | Price Range (RM) | Example Products |
|----------|-------|-----------------|-----------------|
| Printed Tees | 4 | 59 - 69 | The OG, The Sequel, The Remix, The Plot Twist |
| Casual | 11 | 49 - 149 | The Dropout (sweat pants), The Escape (windbreaker), The Maverick (bomber jacket) |
| Professional | 5 | 79 - 159 | The Boardroom (dress shirt), The Partner (dress slacks), The Verdict (silk tie) |
| Accessories | 3 | 29 - 89 | The Detail (dress socks), The Alibi (pocket square), The Verdict (silk tie) |
| Women | 10 | 49 - 189 | The Alibi (cropped tee), The Confession (oversized hoodie), The Corner Office (blazer) |

All products support sizes **S to 10XL** at the same price with no surcharge. Colors available: black, white, navy, red.
