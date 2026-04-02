# PRD: Marketplace Parity — Closing the Gap to Amazon/Lazada

**Product**: Fake by Freetown (getfakenow)
**Date**: 2026-04-02
**Author**: AI-assisted engineering
**Status**: In Progress

---

## 1. Executive Summary

This PRD defines the roadmap to elevate getfakenow from a functional single-seller ecommerce store to a feature-complete marketplace platform comparable to Amazon, Lazada, and Shopee. The platform currently has 37 database tables, 200+ API endpoints, Stripe payments, and a full admin CMS. This document addresses 40 identified gaps organized into 12 implementation phases.

---

## 2. Current State

### What Exists
- Full product catalog with variants, categories, images
- Stripe checkout with webhook handling
- Order lifecycle management (pending → processing → shipped → delivered → return → refund)
- Admin CMS with 20+ modules, visual page builder, rich text editor
- Customer auth (email/password, Google, Facebook OAuth)
- Promotions/coupons, shipping zones, email templates
- Media library, SEO management, URL redirects
- Activity logging, data exports (CSV/PDF)
- Rate limiting, role-based auth (user/admin)

### What's Missing
40 gaps across 6 severity levels — see Section 4.

---

## 3. Goals & Success Criteria

| Goal | Metric |
|------|--------|
| Feature parity with mid-tier marketplace | 90%+ of Lazada buyer features covered |
| Admin operational efficiency | Bulk actions, imports, automated workflows |
| Customer trust & conversion | Reviews, ratings, Q&A on every product |
| Post-purchase experience | Tracking, invoices, in-app notifications |
| Revenue optimization | Abandoned cart recovery, loyalty, flash sales |

---

## 4. Implementation Phases

### Phase 1: Product Reviews & Ratings
**Priority**: Critical — highest conversion impact
**Tables**: `reviews`, `reviewImages`, `reviewVotes`
**Endpoints**:
- Public: list reviews by product, submit review, vote helpful, get rating summary
- Admin: moderate reviews, respond to reviews, flag/remove
**Schema**:
- `reviews`: id, productId, userId, orderId, rating (1-5), title, body, verifiedPurchase, status (pending/approved/rejected), adminResponse, createdAt, updatedAt
- `reviewImages`: id, reviewId, imageUrl, sortOrder
- `reviewVotes`: id, reviewId, userId, helpful (boolean)
**Business Rules**:
- Only verified purchasers can leave reviews (match orderId)
- One review per product per user
- Average rating computed and cached on product record
- Admin approval queue optional (configurable)

### Phase 2: Address Book
**Priority**: Critical — checkout friction
**Tables**: `addresses`
**Endpoints**:
- User: list addresses, create, update, delete, set default
- Checkout: select shipping/billing address
**Schema**:
- `addresses`: id, userId, label (home/office/custom), fullName, phone, line1, line2, city, state, postalCode, country, isDefault, createdAt
**Business Rules**:
- Max 10 addresses per user
- Default address auto-selected at checkout
- Deleting default promotes next address

### Phase 3: Product Picker + Grid Block Enhancement
**Priority**: High — admin UX quick win
**Components**: `ProductPicker.tsx` modal
**Changes**:
- Searchable product picker dialog for PageBuilder productGrid blocks
- Multi-select with drag reorder
- Shows product thumbnail, name, price, stock
- Wired into `productIds` field of ProductGridBlockProps

### Phase 4: Inventory Ledger & Stock History
**Priority**: High — operational integrity
**Tables**: `stockLedger`
**Endpoints**:
- Admin: get stock history per product, create adjustment, get summary
**Schema**:
- `stockLedger`: id, productId, variantId (nullable), type (received/sold/adjusted/returned/reserved), quantity (signed integer), reference (orderId/note), balanceAfter, createdBy, createdAt
**Business Rules**:
- Every stock change creates a ledger entry
- Stock adjustments require a reason
- Sales auto-log on order completion
- Returns auto-log on return approval

### Phase 5: Notifications System (In-App)
**Priority**: High — engagement
**Tables**: `notifications`
**Endpoints**:
- User: list notifications, mark read, mark all read, get unread count
- System: create notification (internal)
**Schema**:
- `notifications`: id, userId, type (order_update/promotion/review_reply/back_in_stock/system), title, message, link, read, createdAt
**Triggers**:
- Order status change → notification
- Review reply from admin → notification
- Promotion about to expire → notification
- Back in stock → notification (Phase 10)

### Phase 6: Abandoned Cart Email Recovery
**Priority**: High — revenue recovery
**Tables**: `cartRecoveryEmails`
**Endpoints**:
- Admin: view recovery stats, configure timing, preview email, manual trigger
- Cron: auto-send recovery emails
**Schema**:
- `cartRecoveryEmails`: id, userId, cartSnapshot (JSON), emailsSent, lastSentAt, convertedAt, status (pending/sent/converted/expired)
**Business Rules**:
- Trigger after 1 hour of cart inactivity (configurable)
- Max 3 reminder emails per abandoned cart
- Stop if user completes purchase or clears cart
- Include cart items with images and prices in email

### Phase 7: Order Invoices & Shipping Enhancements
**Priority**: High — post-purchase
**Tables**: `shipments`
**Endpoints**:
- Customer: download invoice PDF, track shipment
- Admin: create shipment with tracking, partial fulfillment, generate invoice
**Schema**:
- `shipments`: id, orderId, carrier, trackingNumber, trackingUrl, status (pending/in_transit/delivered), shippedAt, deliveredAt, items (JSON array of orderItemIds + quantities)
**Changes**:
- Order can have multiple shipments (partial fulfillment)
- Invoice PDF generation with company details, line items, tax breakdown
- Tracking page with status timeline

### Phase 8: Tax Calculation
**Priority**: High — compliance
**Tables**: `taxRules`
**Endpoints**:
- Admin: manage tax rules by region/category
- Checkout: calculate tax on order
**Schema**:
- `taxRules`: id, name, rate (decimal), country, state (nullable), categoryId (nullable), active, priority
**Business Rules**:
- Tax calculated at checkout based on shipping address
- Category-specific overrides (e.g., digital goods exempt)
- Tax breakdown stored on order record
- Admin can configure SST/GST rates

### Phase 9: Scheduled Tasks & Automation
**Priority**: High — operational
**Implementation**: In-process cron via `node-cron`
**Tasks**:
- Auto-cancel unpaid orders after 24h
- Expire promotions past end date
- Send review request 7 days after delivery
- Abandoned cart email trigger (Phase 6)
- Back-in-stock notification check (Phase 10)
- Session/token cleanup

### Phase 10: Back-In-Stock & Wishlist Notifications
**Priority**: Medium — engagement
**Tables**: `stockAlerts`
**Endpoints**:
- User: subscribe to stock alert, list my alerts
- System: check and send alerts on stock update
**Schema**:
- `stockAlerts`: id, productId, variantId (nullable), userId, email, notified, createdAt, notifiedAt
**Business Rules**:
- Alert sent once when stock > 0
- Remove alert after notification
- Also notify via in-app notification (Phase 5)

### Phase 11: Flash Sales & Voucher System
**Priority**: Medium — revenue & engagement
**Tables**: `flashSales`, `flashSaleProducts`, `vouchers`, `voucherClaims`
**Endpoints**:
- Public: list active flash sales, claim voucher, list my vouchers
- Admin: create/edit flash sale, create vouchers, view claim stats
**Schema**:
- `flashSales`: id, name, startTime, endTime, active
- `flashSaleProducts`: id, flashSaleId, productId, salePrice, stockLimit, soldCount
- `vouchers`: id, code, type (percentage/fixed/freeShipping), value, minOrder, maxUses, perUserLimit, startDate, endDate, active
- `voucherClaims`: id, voucherId, userId, claimedAt, usedAt, orderId
**Business Rules**:
- Flash sale overrides product price during active window
- Stock limit per flash sale item
- Vouchers claimable from a voucher page (no code entry needed)
- Per-user claim limits

### Phase 12: Bulk Operations & Import
**Priority**: Medium — admin efficiency
**Endpoints**:
- Admin: bulk import products (CSV), bulk update stock, bulk update prices, bulk order actions
**Implementation**:
- CSV upload with column mapping UI
- Validation preview before commit
- Progress indicator for large imports
- Bulk order actions: mark shipped, print labels, export

### Phase 13: Granular Admin Permissions
**Priority**: Medium — team scaling
**Tables**: `adminRoles`, `adminPermissions`
**Schema**:
- `adminRoles`: id, name, description, permissions (JSON array)
- Update `users` table: roleId reference
**Permissions Matrix**:
- products:read, products:write, products:delete
- orders:read, orders:write, orders:refund
- customers:read, customers:write, customers:delete
- content:read, content:write
- settings:read, settings:write
- analytics:read

### Phase 14: Search Enhancement
**Priority**: Medium — discovery
**Implementation**: MySQL FULLTEXT index (no external dependency)
**Changes**:
- Add FULLTEXT index on products(name, description)
- Weighted search scoring (name match > description match)
- Search suggestions/autocomplete endpoint
- Search analytics logging (what users search for)
- Category faceted filtering with counts

### Phase 15: Loyalty Points & Gift Cards
**Priority**: Medium — retention
**Tables**: `loyaltyPoints`, `loyaltyTransactions`, `giftCards`, `giftCardTransactions`
**Schema**:
- `loyaltyPoints`: userId, balance, lifetimeEarned, tier
- `loyaltyTransactions`: id, userId, points (signed), type (earned/redeemed/expired/adjusted), reference, createdAt
- `giftCards`: id, code, initialBalance, currentBalance, purchasedBy, recipientEmail, active, expiresAt
- `giftCardTransactions`: id, giftCardId, amount (signed), orderId, createdAt
**Business Rules**:
- Points earned per RM spent (configurable rate)
- Tier thresholds: Bronze/Silver/Gold/Platinum
- Points redeemable at checkout (conversion rate configurable)
- Gift cards purchasable as products, sent via email

### Phase 16: Customer Messaging / Chat
**Priority**: Low — nice to have for single-seller
**Tables**: `conversations`, `chatMessages`
**Endpoints**:
- User: start conversation, send message, list conversations
- Admin: reply, close conversation, list open tickets
**Schema**:
- `conversations`: id, userId, subject, status (open/closed), lastMessageAt
- `chatMessages`: id, conversationId, senderId, senderRole, body, attachmentUrl, readAt, createdAt

### Phase 17: Product Q&A
**Priority**: Low — social proof
**Tables**: `productQuestions`, `productAnswers`
**Schema**:
- `productQuestions`: id, productId, userId, question, status, createdAt
- `productAnswers`: id, questionId, userId, isAdmin, answer, createdAt
**Business Rules**:
- Anyone can ask, only admin or verified purchasers can answer
- Admin answers highlighted

### Phase 18: Multi-Currency & i18n Foundations
**Priority**: Low — internationalization
**Tables**: `currencies`, `translations`
**Implementation**:
- Currency selector with exchange rates
- Price stored in base currency, displayed in selected
- Translation keys for UI strings
- Content translation per locale

### Phase 19: Saved Payment Methods
**Priority**: Low — convenience
**Implementation**:
- Store Stripe Customer ID on user record
- Stripe SetupIntent for card saving
- Card list/delete endpoints
- One-click reorder from order history

### Phase 20: Remaining Polish
**Priority**: Low — completeness
- Product comparison (attribute table)
- Size guide management
- A/B testing framework
- Outgoing webhooks for integrations
- Subscription/recurring orders
- Product bundles/kits
- Multi-seller marketplace (major architectural change — deferred)

---

## 5. Technical Approach

- **Database**: Drizzle ORM migrations for all new tables
- **API**: tRPC procedures following existing patterns (adminProcedure/protectedProcedure/publicProcedure)
- **Validation**: Zod schemas on all inputs
- **Frontend**: React components following existing shadcn/ui + Tailwind patterns
- **Testing**: Validate each phase compiles and existing tests pass
- **Git**: One commit per phase with descriptive messages

---

## 6. Out of Scope (This PRD)

- Multi-seller/marketplace architecture (requires fundamental redesign)
- Mobile app (React Native)
- Elasticsearch/Algolia (using MySQL FULLTEXT instead)
- Real-time websockets (using polling for notifications)
- External shipping carrier API integration (tracking URL manual entry)
- Kubernetes/Docker deployment infrastructure
