# Fake by Freetown - 2026 Modern Lifestyle Commerce Build

## Phase 1: Homepage Redesign (COMPLETE ✅)
- [x] Update global styles for dark mode + modern 2026 aesthetic
- [x] Create hero section with lifestyle imagery + CTA
- [x] Build "Trending Now" carousel component
- [x] Implement smart search with autocomplete
- [x] Create live filters (category, price, size, color)
- [x] Build lifestyle collections grid (4 categories)
- [x] Add social proof section (reviews, trust badges)
- [x] Implement editorial content section
- [x] Mobile responsiveness testing
- [x] Performance optimization (images, lazy loading)

## Phase 2: Product Filtering & Search (COMPLETE ✅)
- [x] Create Shop page with product grid layout
- [x] Build sidebar filter component (category, price, size, color)
- [x] Implement live filter state management
- [x] Add price range slider
- [x] Create search bar with autocomplete suggestions
- [x] Build search results page
- [x] Integrate AI-powered product recommendations
- [x] Add "You might also like" section
- [x] Implement filter persistence (URL params)
- [x] Mobile filter drawer UI

## Phase 3: Cart & Checkout
- [ ] Build shopping cart page
- [ ] Implement 3-step checkout flow
- [ ] Integrate Stripe payment processing
- [ ] Add multiple payment options (Apple Pay, PayPal)
- [ ] Create order confirmation page
- [ ] Implement order tracking
- [ ] Add saved addresses for returning customers
- [ ] Build promo code system

## Phase 4: Trust & Content
- [ ] Implement review system (database + UI)
- [ ] Add customer testimonials
- [ ] Create live chat component
- [ ] Build blog/guides section
- [ ] Implement user-generated content gallery
- [ ] Add FAQ section
- [ ] Create shipping/returns policy pages
- [ ] Add security badges and trust signals

## Phase 5: Optimization & Launch
- [ ] Performance testing and optimization
- [ ] SEO implementation (meta tags, structured data)
- [ ] Analytics setup (Google Analytics, Mixpanel)
- [ ] A/B testing framework
- [ ] Mobile app consideration
- [ ] Final QA and bug fixes
- [ ] Deployment preparation

## Completed Work
- [x] Initial project setup with apparel focus
- [x] Luxury minimalist homepage design
- [x] Media file compression (PNG → WebP, 95% reduction)
- [x] S3 CDN integration for all assets
- [x] Design proposal for 2026 modern aesthetic
- [x] Red & white color scheme redesign (matching brand logo)
- [x] Replaced emoji with custom Lucide React icons
- [x] Enhanced typography, spacing, and micro-interactions
- [x] Implemented luxury UX/UI improvements


## Homepage Cleanup (COMPLETE ✅)
- [x] Fix header layout and alignment
- [x] Fix hero section centering and spacing
- [x] Fix product grid layout and card sizing
- [x] Fix plus size section layout
- [x] Fix trust section alignment
- [x] Fix newsletter section
- [x] Fix footer layout and spacing
- [x] Overall visual polish and consistency
- [x] Fix Tailwind 4 @theme directive for OKLCH colors
- [x] Switch ThemeProvider to light mode
- [x] Improve footer spacing and readability

## Product Detail Pages (COMPLETE ✅)
- [x] Create product data model with all tee variants (8 products in DB)
- [x] Build ProductDetail page component with red & white design
- [x] Implement size selector (S, M, L, XL for standard; XL, 2XL, 3XL, 4XL for plus)
- [x] Implement color selector with swatches (white, black, red, cream)
- [x] Add product descriptions and care instructions (accordion)
- [x] Product image with color variant switching
- [x] Wire up routing from homepage product cards to detail pages
- [x] Add "Add to Cart" functionality with quantity selector
- [x] Implement "You might also like" recommendations (related products)
- [x] Trust badges (free shipping, 30-day returns, secure checkout)
- [x] Size guide with measurement table
- [x] Wishlist button
- [x] Breadcrumb navigation
- [x] SEO meta tags and structured data
- [x] Mobile responsive design

## Logo Update
- [ ] Update header logo to "Fake by Freetown" with "by Freetown" in cursive
- [ ] Apply same logo treatment across all pages (Home, Shop, ProductDetail)

## Size & Logo Updates
- [ ] Add Dancing Script cursive font for logo
- [ ] Update header logo to "Fake" + "by Freetown" in cursive across all pages
- [ ] Remove separate Plus Size section from homepage
- [ ] Merge all sizes into single range: S to 10XL
- [ ] Update product detail page size selector to S-10XL
- [ ] Remove "PLUS SIZE" nav link from header
- [ ] Remove plus-size product variants from database

## Product Catalog Expansion
- [ ] Generate product images for casual items (sweat pants, windbreakers, collared tees, mandarin collar, v-neck)
- [ ] Generate product images for business items (white shirts, slacks, socks, handkerchiefs, ties)
- [ ] Insert all new products into database
- [ ] Update homepage to showcase all categories
- [ ] Create Business section on homepage
- [ ] Update product detail page for new product types
- [ ] Update size selector to S-10XL on all products
- [ ] Remove separate Plus Size section and nav link
- [ ] Update header logo to "Fake by Freetown" with cursive

## Cart & Checkout Redesign
- [x] Restyle Cart page to match red/white brand theme (remove generic shadcn look)
- [x] Restyle Checkout page to match brand theme
- [x] Fix currency from USD to MYR in Stripe checkout
- [x] Fix homepage product slugs to match database slugs
- [x] Ensure cart badge count updates in header across all pages
- [x] Add hero background image to homepage
- [x] Build About page with brand story
- [x] Fix "Continue Shopping" links to point to /shop instead of /products

## Copy Updates
- [x] Update size promise section on About page with new brand copy
- [x] Update size promise section on Homepage with new brand copy

## Women's Section
- [x] Create women's clothing category in database
- [x] Design women's product line with names, descriptions, materials, care instructions
- [x] Generate AI product images for women's clothing (multiple angles)
- [x] Seed women's products into database with full details
- [x] Add Women's nav link to header across all pages
- [x] Create Women's category page (products accessible via /shop?category=women)
- [x] Update product detail page to display materials and care instructions
- [x] Update homepage to feature women's section

## Men's Product Personality & Details
- [x] Give each printed tee a product name and personality description with materials/care
- [x] Give each casual product a product name and personality description with materials/care
- [x] Give each business product a product name and personality description with materials/care

## Hero & Shop Improvements
- [x] Add Women's Line CTA button to hero section
- [x] Fix shop page category filter to properly filter women's products

## Seller Center Phase 1 — Admin Backend
- [x] Schema: Add SKU, weight, compareAtPrice columns to products table
- [x] Schema: Add shippingCost, trackingNumber, trackingUrl, notes, refundedAmount columns to orders table
- [x] Schema: Create orderStatusHistory table for audit trail
- [x] Schema: Create activityLog table for admin action logging
- [x] Backend: Admin dashboard stats procedure (GMV, orders, customers, revenue trends)
- [x] Backend: Admin orders list with filters (status, date range, search)
- [x] Backend: Admin order detail with status update and notes
- [x] Backend: Admin products CRUD with image upload (enhance existing)
- [x] Backend: Admin inventory view procedure (stock levels, low stock alerts)
- [x] Backend: Admin customer list with order history and lifetime value
- [x] Backend: Admin analytics procedures (sales trends, product performance, category breakdown)
- [x] Frontend: Admin sidebar layout with navigation (Dashboard, Orders, Products, Inventory, Customers, Analytics, Settings)
- [x] Frontend: Admin dashboard page with KPI cards and revenue chart
- [x] Frontend: Admin orders list page with filters and status badges
- [x] Frontend: Admin order detail page with status timeline and actions
- [x] Frontend: Admin products list page with stock, status, performance columns
- [x] Frontend: Admin product create/edit form with image upload
- [x] Frontend: Admin inventory management page with low stock alerts
- [x] Frontend: Admin customer list page with search and lifetime value
- [x] Frontend: Admin customer detail page with order history
- [x] Frontend: Admin sales analytics page with date range selector and charts
- [x] Frontend: Admin route protection (redirect non-admins)
- [x] App.tsx: Register all admin routes under /admin/*

## Seller Center Expanded Modules
- [x] Schema: Create emailTemplates, campaigns, campaignRecipients tables
- [x] Schema: Create banners, staticPages, contentBlocks tables
- [x] Schema: Create navigationItems, mediaLibrary tables
- [x] Schema: Create seoMetadata, redirects, shippingZones tables
- [x] Schema: Create promotions, siteSettings tables
- [x] Backend: Email templates CRUD procedures
- [x] Backend: Campaigns CRUD with send/schedule procedures
- [x] Backend: Cart recovery procedures
- [x] Backend: Banners CRUD procedures
- [x] Backend: Static pages and content blocks CRUD procedures
- [x] Backend: Navigation items CRUD procedures
- [x] Backend: Media library upload/list/delete procedures
- [x] Backend: SEO metadata and redirects CRUD procedures
- [x] Backend: Shipping zones CRUD procedures
- [x] Backend: Promotions CRUD with validation procedures
- [x] Backend: Site settings get/set procedures
- [x] Backend: Activity log list procedure
- [x] Frontend: Email Templates management page
- [x] Frontend: Campaigns management page (broadcast messaging)
- [x] Frontend: Banners management page (homepage slides)
- [x] Frontend: CMS Pages management page (static pages + content blocks)
- [x] Frontend: Navigation management page (header/footer links)
- [x] Frontend: Media Library page (upload, search, copy URL)
- [x] Frontend: Shipping zones management page
- [x] Frontend: SEO management page (meta tags, redirects, settings)
- [x] Frontend: Promotions management page (discount codes)
- [x] Frontend: Categories management page
- [x] Frontend: Analytics page (revenue trends, order status breakdown)
- [x] Frontend: Settings page (store info, currency, social, messaging channels)
- [x] Frontend: Activity Log page
- [x] App.tsx: All 18 admin routes registered

## Multi-Provider Auth & Customer Profiles
- [x] Schema: Add phone, address fields (street, city, state, zip, country), addressVerified flag to users
- [x] Schema: Add marketingConsent, consentDate, marketingChannel preferences to users
- [x] Schema: Create customerTags table for segmentation/tagging
- [x] Schema: Create customerEvents table for behavior tracking (page views, cart actions, purchases)
- [x] Schema: Add authProvider field to track login source (manus, google, facebook)
- [x] Schema: Add profileCompleted flag and onboardingStep tracker
- [x] Backend: Google OAuth flow (client ID, callback, token exchange)
- [x] Backend: Facebook OAuth flow (app ID, callback, token exchange)
- [x] Backend: Customer profile update procedure (phone, address, marketing consent)
- [ ] Backend: Address verification flow
- [x] Backend: Customer tagging CRUD (admin can tag customers for segmentation)
- [x] Backend: Customer event tracking procedure (log browsing, cart, purchase events)
- [x] Backend: Marketing consent management (opt-in, opt-out, preference center)
- [x] Frontend: Multi-provider login modal (Manus + Google + Facebook buttons + email/password)
- [x] Frontend: Post-login onboarding form (name, phone, address, marketing consent)
- [x] Frontend: Customer profile page (edit info, manage consent, view order history)
- [ ] Frontend: Admin customer detail with tags, events timeline, marketing status
- [x] Seed naveen.edmarker@gmail.com as super admin

## CSV Export Feature
- [x] Backend: Add CSV export procedure for products (all fields, admin-only)
- [x] Backend: Add CSV export procedure for orders (all fields, admin-only)
- [x] Frontend: Add "Export CSV" button to admin Products page
- [x] Frontend: Add "Export CSV" button to admin Orders page
- [x] Write tests for CSV export procedures

## 20 New Printed Tee Products
- [x] Generate AI product images for all 20 new tees
- [x] Upload all images to S3 CDN
- [x] Write personality descriptions, material specs, and care instructions for all 20
- [x] Seed all 20 products into database
- [x] Verify products display correctly on storefront

## Customer CSV Export
- [x] Backend: Add customer CSV export procedure with tags, lifetime value, marketing consent
- [x] Frontend: Add "Export CSV" button to admin Customers page

## Orders Export Date Range Filter
- [x] Frontend: Add date picker inputs to admin Orders page for date range filtering on export

## Analytics/Sales Report Export
- [x] Backend: Add analytics CSV export procedure (daily revenue, order counts, top products)
- [x] Frontend: Add export button to admin Analytics page with date range selector

## New Arrivals Homepage Section
- [x] Add "New Arrivals" section to homepage spotlighting the 20 new tees

## Color Variants for All Products
- [x] Add black/white/navy color variants to all products via productImages table
- [x] Seed color variants into database (3 colors minimum per product)

## Women's Line Expansion
- [x] Design 5 women's skirts (casual and semi-formal) with names, descriptions, materials
- [x] Design 5 women's blouses (casual and semi-formal) with names, descriptions, materials
- [x] Generate AI product images for women's skirts and blouses
- [x] Seed 10 women's skirts and blouses into database

## Headline Drop Marketing Banner
- [x] Create "Headline Drop" marketing banner in admin for new collection announcement
- [x] Generate banner image and insert into bannerSlides database

## Carousel Slider Redesign
- [x] Replace browser scrollbar on New Arrivals carousels with subtle, intuitive slider (arrows + dots or drag)
- [x] Rename "THE GEN Z COLLECTION" to "CHRONICALLY ONLINE"

## Color-Specific Product Images
- [x] Generate white variant images for all 69 products (138 total)
- [x] Generate navy variant images for all 69 products
- [x] Upload all 138 color variant images to S3 CDN
- [x] Update productImages table with distinct color-specific image URLs

## Product Page SEO Improvements
- [x] Review and enhance structured data (JSON-LD) on product detail pages
- [x] Add SEO meta tags to Home page (Organization + WebSite structured data)
- [x] Add SEO meta tags to Shop page (breadcrumbs, dynamic title/description per category)
- [x] Update canonical URLs to getfakenow.com across index.html
- [x] Add descriptive alt text to all product images
- [x] Improve meta titles and descriptions for product pages
- [x] Add canonical URLs and Open Graph tags
- [x] Review breadcrumb markup for SEO

## Women's Size Range Update
- [x] Update women's products to include XXS and XS sizes
- [x] Cap women's sizes at 4XL instead of 10XL
- [x] Update frontend size display logic to show correct range per product/category

## Women's Size Guide
- [x] Create women's measurement chart (bust, waist, hip) for XXS-4XL
- [x] Update size guide modal to show women's chart for women's products and men's/unisex chart for others

## Label-as-Collection System (like Levi's tabs)
- [x] Map 5 label designs to 5 collections: HEADLINE (Printed Tees), ESSENTIAL (Casual), PROFESSIONAL (Business), WOMEN (Women's line), ACCESSORIES (Premium accessories)
- [x] Identify 66 products where back collar is visible and label application is relevant
- [x] Generate 66 back-collar label images across all 5 collections
- [x] Upload 66 label images to S3 and insert into productImages table as 'label' color
- [x] Add collection badge to product detail page (HEADLINE/ESSENTIAL/PROFESSIONAL/WOMEN/ACCESSORIES)
- [x] Add clickable label image thumbnail on product detail page
- [x] Filter label images out of color selector (only show black/white/navy)

## Logo & Image Consistency Fixes
- [x] Fix logo rendering to be consistent across all pages — created shared Logo component
- [x] Replaced all 13 logo instances: Account, Orders, OrderConfirmation, Casual, Professional, Products, PrivacyPolicy, ReturnsPolicy, ShippingPolicy, TermsOfService, Admin, AdminLayout, Profile, Footer
- [x] Fix logo on mobile breakpoints (all pages now use same shared component)
- [x] Review product image consistency across color variants (ensure same composition/style)

## Product Image Consistency Fix (v2)
- [x] Audit all 69 products for image inconsistency across black/white/navy variants
- [x] Regenerate 69 white variant images by AI-editing black originals (maintaining composition)
- [x] Regenerate 69 navy variant images by AI-editing black originals (maintaining composition)
- [x] Upload all 138 recolored images to S3 CDN
- [x] Update all 138 database records with new CDN URLs
- [x] Verify consistency on product pages (Trust Me I'm Fake, The Alibi)

## PRD Feedback Fixes — P0 (Launch Blockers)
- [x] P0: Replace console.log email with real email transport (using platform notification system)
- [x] P0: Add rate limiting on auth endpoints (login, register, forgotPassword)

## PRD Feedback Fixes — P1 (High Priority)
- [x] P1: Inventory concurrency — wrap checkout in DB transaction with SELECT FOR UPDATE
- [x] P1: Add flat-rate shipping line item to Stripe checkout (free over RM75)
- [x] P1: Enforce email verification before allowing checkout

## PRD Feedback Fixes — P2 (Medium Priority)
- [x] P2: Add return_requested and returned to order status enum
- [x] P2: Build basic return request flow (customer initiate + admin process)
- [x] P2: Add data anonymization procedure for PDPA compliance
- [x] P2: Add database indexes on orders.createdAt, orders.userId, products.categoryId, orderItems.orderId

## PRD Feedback Fixes — Tests
- [x] Write tests for rate limiting
- [x] Write tests for inventory concurrency locking
- [x] Write tests for email verification enforcement

## Frontend: Email Verification Banner
- [x] Create EmailVerificationBanner component with dismissible alert and resend button
- [x] Integrate banner into account/profile page
- [x] Integrate banner into checkout page (sticky variant)
- [x] Add verify-email route to handle token verification from email link

## Frontend: Return Request UI
- [x] Add "Request Return" button on customer order detail page for delivered orders
- [x] Build return reason textarea with validation (min 10 chars)
- [x] Show return request status on order detail page (return_requested + returned)

## Frontend: Admin Anonymize Customer
- [x] Add "Anonymize Customer" button on admin customer detail page
- [x] Build confirmation dialog with warning about irreversible action
- [x] Call admin.customers.anonymize procedure and handle success/error

## Separate Admin Login System
- [x] Create admin-specific login tRPC procedure with stronger password validation (min 12 chars)
- [x] Create separate admin session cookie (admin_session) with 30-min inactivity timeout
- [x] Build dedicated /admin/login page with email+password form (no OAuth/social)
- [x] Update admin route guards to check admin session cookie instead of customer OAuth
- [x] Admin accounts created only via DB promotion or admin invite — no self-registration
- [x] Add admin session refresh on activity (sliding window timeout)
- [x] Write tests for admin login, session timeout, and access control

## Portability Audit
- [x] Remove any hard-coded URLs (use env vars or relative paths)
- [x] Ensure all config is environment-variable driven (VITE_SITE_URL)
- [x] Verify standard Express/React patterns — no platform-specific dependencies

## Invite Admin Feature
- [x] Add admin_invites table to schema (token, email, invitedBy, expiresAt, usedAt)
- [x] Create admin invite procedure (generate secure token, send email with setup link)
- [x] Create accept-invite procedure (validate token, set password, create admin account)
- [x] Build "Invite Admin" UI in admin settings page with email input
- [x] Build /admin/setup page for invited admins to set their password
- [x] List pending/used invites in admin settings with revoke capability

## Returns Management Dashboard
- [x] Add dedicated /admin/orders/returns page with filter tabs
- [x] Show only return_requested orders with customer reason and order details
- [x] Add "Approve Return" action button with confirmation dialog and admin note
- [x] Show return timeline (requested date, processed date)
- [x] Add return stats cards (pending returns, processed returns)

## Admin Activity Audit Log
- [x] Enhanced activityLog table with ipAddress field
- [x] Create audit logging helper function (logAdminAction, getClientIp)
- [x] Log admin login/logout events with IP tracking
- [x] Log admin order status changes, invite create/revoke, customer anonymization
- [x] Build admin audit log page with filterable table (by action type, admin user, search)
- [x] Add pagination and color-coded action icons
- [x] Write tests for audit log, invite admin, and returns dashboard (117 tests passing)

## Gamified Checkout Flow with Cheeky Marketing
- [x] Audit existing cart, checkout, and order confirmation pages
- [x] Enhance cart page with free shipping progress bar and cheeky milestone messages
- [x] Add urgency cues and FOMO elements (stock indicators, social proof counter)
- [x] Add smart upsell/cross-sell suggestions in cart ("People Also Faked These")
- [x] Build gamified checkout steps with witty copy at each stage (3-step: Shipping → Review → Payment)
- [x] Add trust badges and reassurance messaging throughout checkout (SSL, PCI, Tracked Delivery)
- [x] Build celebratory order confirmation page with confetti, share prompts, and next-steps timeline
- [x] Add cheeky empty cart state with CTA to shop
- [x] Ensure mobile-responsive checkout flow
- [x] Write tests for checkout flow (126 tests passing)

## Promo/Discount Code System
- [x] Reuse existing promotions table + add promoCodeUsages table to schema
- [x] Create tRPC procedures: promo.validate with cheeky success/error messages
- [x] Integrate discount display into cart sidebar with animated success/error states
- [x] Build promo code input field in cart sidebar with "You legend" / "Nice try" messages
- [x] Promo validation checks: active, not expired, min order, max uses, per-user limit

## Wishlist Feature
- [x] Add wishlists table to schema (userId, productId, createdAt)
- [x] Create tRPC procedures: wishlist.toggle, wishlist.list, wishlist.count, wishlist.productIds
- [x] Add heart icon on product cards in Shop page (filled = in wishlist)
- [x] Add heart icon on product detail page with toggle functionality
- [x] Build /wishlist page with cheeky empty state and "Add to Cart" buttons
- [x] Wishlist items show product images, prices, and quick-add to cart

## Order Tracking Page
- [x] Leverage existing trackingNumber and trackingUrl fields in orders schema
- [x] Create tRPC procedures: tracking.getByOrderNumber (auth), tracking.publicTrack (guest)
- [x] Build /orders/:orderId tracking page with visual timeline
- [x] Add cheeky status messages for each stage (confirmed → packing → shipped → delivered)
- [x] Add tracking link integration for external courier tracking
- [x] Write tests for promo codes, wishlist, and order tracking (142 tests passing)

## Stripe Refund Integration for Returns
- [x] Audit existing return approval procedure and Stripe payment intent storage
- [x] Leverage existing refundedAmount field in orders schema (already present)
- [x] Create Stripe refund helper function in stripe.ts (full and partial refund support)
- [x] Update admin return approval procedure to issue Stripe refund automatically via createRefund
- [x] Update Returns dashboard UI with refund type selector (full/partial/none) and amount input
- [x] Add refund status badges on returns list (Full Refund, Partial Refund, Refunded)
- [x] Send refund confirmation email to customer via sendRefundConfirmationEmail
- [x] Write tests for refund flow (156 tests passing across 16 files)

## Refund UI Optimization
- [x] Improve partial refund input with quick-fill buttons (25%, 50%, 75%, Subtotal Only)
- [x] Add refund amount validation (cannot exceed original order total)
- [x] Show refund breakdown (original amount, shipping, items) in confirmation dialog
- [x] Add refund reason dropdown (defective, wrong item, customer changed mind, other)
- [x] Show refund processing status with spinner/progress indicator

## Customer Notifications Improvement
- [ ] Send return request acknowledgment email when customer initiates return
- [x] Send return approved/rejected notification email with refund details
- [x] Send refund processed confirmation with Stripe refund ID and expected timeline
- [ ] Add notification preferences for return/refund updates

## Admin Refund History Dashboard
- [x] Create refunds table in schema to track all refund records with Stripe IDs
- [x] Build tRPC procedures for refund history with filtering (date range, status, amount)
- [x] Build /admin/orders/refunds page with sortable table (Stripe ID, order number, amount, timestamp)
- [x] Add refund stats cards (total refunded, count, average refund amount)
- [x] Add CSV export for refund history
- [x] Add PDF export for refund history
- [x] Add date range picker for filtering refunds
- [x] Write tests for refund history and export features (25 tests passing)

## PDF Export for Refund History
- [x] Install PDF generation library (pdfkit)
- [x] Create server-side PDF generation procedure for refund history
- [x] Add PDF download button to admin refund history page
- [x] Include refund stats summary, table with Stripe IDs, and date range in PDF

## Return Request Acknowledgment Emails
- [x] Create return request acknowledgment email template
- [x] Trigger acknowledgment email when customer initiates a return
- [x] Include order details, return reason, and next steps in email
- [x] Write tests for acknowledgment email

## Refund Analytics Chart on Admin Dashboard
- [x] Build tRPC procedure for refund trend data with daily/weekly/monthly grouping
- [x] Create RefundTrendsChart component with Recharts (ComposedChart + AreaChart)
- [x] Add period toggle (daily/weekly/monthly) and count/amount toggle to chart
- [x] Show refund count and total amount trends with summary stats
- [x] Integrate chart into admin dashboard page
- [x] Write tests for refund trends procedure (41 tests total, all passing)

## CMS Backend - Full Operational Upgrade

### Customers Management
- [x] Add "Create Customer" form with name, email, phone, address fields
- [x] Add inline edit for customer fields (name, phone, address)
- [x] Add help guidelines and subtext on each field
- [x] Add form validation (email format, required fields)
- [x] Add confirmation dialogs for role changes and destructive actions

### Orders & Logistics
- [x] Add fulfillment workflow (pending → processing → shipped → delivered)
- [x] Add bulk status update for multiple orders
- [x] Add print packing slip / invoice
- [x] Add order timeline with status history visualization
- [x] Add help text explaining each status transition
- [x] Add confirmation dialogs for status changes
- [x] Add order detail side panel with full item breakdown

### Media Library
- [x] Add video upload support (mp4, webm, mov)
- [x] Add video preview/playback in media grid
- [x] Add file type badges (image, video, document)
- [x] Add drag-and-drop upload
- [ ] Add bulk upload support
- [x] Add file size limits with clear error messages
- [x] Add help guidelines for supported formats and size limits

### Pages & Content
- [x] Add page status (draft/published) with toggle
- [x] Add visual preview of content blocks
- [x] Add media picker integration for image/video in content
- [x] Add help text for block types and content formatting
- [x] Add validation for required fields (title, slug, body)
- [x] Add confirmation before publishing/unpublishing

### Products, Categories & Inventory
- [x] Add inline validation on product form fields
- [x] Add help subtext for pricing, SKU, weight fields
- [x] Add confirmation dialog before deleting products/categories
- [x] Add stock level warnings with color-coded badges
- [x] Add bulk stock update capability
- [x] Add category help text explaining hierarchy

### Marketing (Promotions, Campaigns, Banners)
- [x] Add promotion validation (dates, discount amounts, code format)
- [x] Add campaign status badges (draft, active, completed, paused)
- [x] Add banner preview with dimensions guide
- [x] Add help text for each marketing feature
- [x] Add confirmation before activating/deactivating promotions

### Settings, Shipping, SEO, Email Templates
- [x] Add field-level validation for settings (email format, URL format)
- [x] Add confirmation before saving critical settings
- [x] Add help guidelines for shipping zone configuration
- [x] Add SEO score/checklist with recommendations
- [x] Add email template preview with variable substitution
- [x] Add validation for email template variables
- [x] Write CMS upgrade tests (29 tests, all passing)

## CMS UI Consistency Refinement
- [x] Audit all admin pages for UI inconsistencies
- [x] Create shared CMS UI components (PageHeader, HelpText, HelpBanner, FormField, ConfirmDialog, StatusBadge, EmptyState, StatsCard, TableWrapper, SectionHeader)
- [x] Standardize page headers (title, description, action buttons) across all 21 admin pages
- [x] Standardize table styling (borders, padding, hover states, empty states)
- [x] Standardize dialog patterns (size, padding, button placement)
- [x] Standardize help text styling (icon, color, font size)
- [x] Standardize status badges (colors, sizes, labels)
- [x] Standardize button styles and placement (primary/secondary/destructive)
- [x] Standardize card layouts and spacing
- [x] Standardize form field layouts and validation error display
- [x] Standardize empty states with consistent illustration/messaging
- [x] Apply shared components to Dashboard, Orders, Customers, Products
- [x] Apply shared components to Categories, Inventory, Media, Pages
- [x] Apply shared components to Promotions, Campaigns, Banners, Shipping, SEO, Settings, Email Templates
- [x] Apply shared components to ActivityLog, Analytics, Navigation, RefundHistory, Returns, Team
- [x] All 226 tests passing after UI consistency changes
