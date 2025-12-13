# E-Commerce Platform TODO

## Database & Schema
- [x] Design and implement product categories table
- [x] Design and implement products table with inventory tracking
- [x] Design and implement shopping cart table
- [x] Design and implement orders and order items tables
- [x] Design and implement product images table for S3 storage
- [x] Create database seed script with sample categories and products

## Backend API (tRPC Procedures)
- [x] Product catalog procedures (list, search, filter by category)
- [x] Product details procedure
- [x] Shopping cart procedures (add, remove, update quantity, get cart)
- [x] Category listing procedure
- [x] Checkout procedure with order creation
- [x] Order history procedure for users
- [x] Order details procedure
- [x] Admin product management procedures (create, update, delete)
- [x] Admin order management procedures (list all orders, update status)
- [x] Admin inventory management procedures
- [x] Product image upload procedure with S3 integration

## Payment Integration
- [x] Integrate Stripe payment processing feature
- [x] Create Stripe checkout session procedure
- [x] Handle payment confirmation and order completion

## Customer-Facing Frontend
- [x] Home page with featured products and elegant design
- [x] Product catalog page with search and filtering
- [x] Product detail page with add to cart functionality
- [x] Shopping cart page with quantity management
- [x] Checkout page with order summary
- [x] Order confirmation page
- [x] User account page with order history
- [x] Order tracking page with status updates
- [x] Responsive navigation with cart indicator

## Admin Panel
- [x] Admin dashboard layout with sidebar navigation
- [x] Product management page (list, add, edit, delete)
- [ ] Product image upload interface
- [x] Inventory management interface
- [x] Order management page with status updates
- [ ] Order details view for admin
- [ ] Admin-only access control

## Testing & Quality
- [x] Write vitest tests for product procedures
- [x] Write vitest tests for cart procedures
- [x] Write vitest tests for admin procedures
- [x] All tests passing
- [ ] Write vitest tests for all tRPC procedures
- [ ] Test authentication and authorization flows
- [ ] Test cart operations and checkout flow
- [ ] Test admin operations and access control
- [ ] Test payment integration

## Deployment
- [ ] Create final checkpoint for deployment

## Design Updates - Levi's Aesthetic
- [x] Update color scheme to classic Levi's-inspired palette (indigo, red tab accent)
- [ ] Revise typography for heritage denim brand feel
- [ ] Update hero section messaging for apparel focus
- [x] Update seed data with selected apparel: graphic tees, joggers, polos, hoodies, oxford shirts, chambray shirts, caps
- [x] Create authentic clothing descriptions with sizes and materials

## Bug Fixes
- [x] Fix nested anchor tag error on home page

## Logo Design
- [x] Generate bold typography logo version (improved from user's concept)
- [x] Generate cursive elegant logo version
- [x] Generate combined "Fake by Freetown" lockup

## Logo Revisions
- [x] Regenerate cursive logo in red instead of navy
- [x] Make "by Freetown" text bolder and more prominent
- [x] Update lockup logo with red cursive and bold Freetown text

## Brand Color Updates
- [x] Update primary color to red (#DC2626) in index.css
- [x] Change "Fake" logo color to red in header
- [x] Update button colors to red throughout the site
- [x] Ensure all brand touchpoints use red as primary color

## Copy Revisions
- [x] Revise hero section copy to be more direct and understated
- [x] Update brand story section with authentic streetwear voice
- [x] Remove flowery marketing language throughout site
- [x] Match tone of premium streetwear brands (Supreme, Stüssy, Carhartt WIP)

## Size Selection Feature
- [x] Add size field to cart_items table schema
- [x] Update cart procedures to accept and store size
- [x] Add size dropdown to ProductDetail page
- [x] Update cart display to show selected sizes
- [x] Update checkout to include size information in orders
- [x] Write tests for size selection functionality

## Color Selection Feature
- [x] Add color field to cart_items table schema
- [x] Add color field to order_items table schema
- [x] Update cart procedures to accept and store color
- [x] Add color swatch UI to ProductDetail page (black, white, navy, red)
- [x] Update cart display to show selected colors
- [x] Update checkout to include color information in orders
- [x] Write tests for color selection functionality

## Product Image Generation
- [x] Generate t-shirt images with Fake logo (black, white, red, navy)
- [x] Generate oxford button-down shirt images (professional line)
- [x] Generate chambray work shirt images (professional line)

## Slogan Graphic Tees & Mannequin Display
- [x] Generate "It's all Fake" slogan tees on mannequins (multiple colors)
- [x] Generate "Fake is not Hate" slogan tees on mannequins (multiple colors)
- [x] Generate "Live Life. Stay Fake." slogan tees on mannequins (multiple colors)
- [x] Regenerate logo tees on mannequins for store-like presentation
- [x] Regenerate office shirts on mannequins for professional display

## Product Image Upload
- [x] Upload all generated product images to S3 storage
- [x] Update database products table with S3 image URLs
- [x] Verify images display correctly on product pages

## Color Variant Image Switching
- [ ] Generate product images for all color variants (black, white, navy, red)
- [x] Add color field to product_images table to link images to color variants
- [x] Map existing variant images to products in database
- [x] Update product detail page to switch images on color click
- [x] Test color variant switching functionality

## Footer Update
- [x] Update copyright year to 2026 in all page footers

## Currency Update
- [x] Change currency from USD ($) to Malaysian Ringgit (RM) across all pages
- [x] Update formatPrice function to use RM symbol

## Missing Product Images
- [x] Identify products without images
- [x] Generate images for products missing photos
- [x] Upload new images to S3 and update database

## Collection Pages
- [x] Create Casual collection page component
- [x] Create Professional collection page component
- [x] Add collection routes to App.tsx
- [x] Update navigation to include Casual and Professional links
- [x] Update hoodie product name to "Fake Signature Hoodie"

## Fake Signature Hoodie Image
- [x] Generate professional mannequin photo of Fake Signature Hoodie with embroidered logo
- [x] Upload hoodie image to S3
- [x] Update database with hoodie image URL
- [x] Verify hoodie image displays correctly on all pages

## E-Commerce Policy Pages
- [x] Create Privacy Policy page with PDPA compliance
- [x] Create Shipping Policy page with Malaysian shipping details
- [x] Create Returns & Refunds Policy page
- [x] Create Terms of Service page
- [x] Add policy routes to App.tsx
- [x] Update footer with policy links
- [x] Verify all policy pages display correctly

## Product Images and Variants Audit
- [x] Audit all products for missing images
- [x] Verify all color variants have correct data
- [x] Generate missing product images
- [x] Ensure all images are uploaded to S3
- [x] Test product pages display correctly

## Color Variant Images Generation
- [x] Generate Fake Signature Hoodie in black, white, navy, red
- [x] Generate Classic Pique Polo in black, white, navy, red
- [x] Generate Essential Joggers in black, white, navy, red
- [x] Generate Fake Script Cap in black, white, navy, red
- [x] Upload all variant images to S3
- [x] Update productImages table with all variants
- [x] Debug tRPC data flow to identify why frontend doesn't receive images array
- [x] Fix color variant switching implementation (PRIORITY)
- [x] Debug getDisplayImage() function in ProductDetail.tsx
- [x] Ensure selectedColor state properly updates image display
- [x] Test color switching on all products with variants
- [x] Remove debug UI after fixing

## SEO Implementation
- [x] Create SEO utility functions for meta tags generation
- [x] Add meta tags component with title, description, Open Graph, Twitter Cards
- [x] Implement product schema (JSON-LD) with price, availability, brand, SKU
- [x] Implement organization schema with logo and social profiles
- [x] Implement breadcrumb schema for navigation
- [x] Add local business markup for Malaysian business
- [x] Generate XML sitemap with all product and page URLs
- [x] Create robots.txt configuration
- [x] Add canonical URLs to all pages
- [x] Optimize all product images with descriptive alt text
- [x] Ensure semantic HTML structure with proper heading hierarchy
- [ ] Add structured data for product reviews and ratings (future)
- [x] Implement image metadata optimization
- [x] Test structured data with Google Rich Results Test
- [x] Verify sitemap accessibility and format

## Image Naming Optimization for SEO
- [x] Audit all current product image filenames in database
- [x] Audit all productImages (color variants) filenames in database
- [x] Define SEO-optimized naming convention (descriptive, keyword-rich, hyphen-separated)
- [x] Generate new SEO-friendly names for all main product images
- [x] Generate new SEO-friendly names for all color variant images
- [x] Upload renamed images to S3 with new filenames
- [x] Update products table with new main image URLs
- [x] Update productImages table with new variant image URLs
- [x] Validate all images are accessible at new URLs
- [x] Verify all product pages display images correctly
- [x] Verify all collection pages display images correctly
- [x] Update image alt text to match new descriptive filenames
- [x] Run final validation across entire site
- [ ] Clean up old image files from S3 (optional)

## Branding Updates
- [x] Generate custom favicon for Fake by Freetown brand
- [x] Update site title from "Are You Fake?" to brand-appropriate title
- [x] Rewrite site description with cool copywriter voice
- [x] Update VITE_APP_TITLE environment variable
- [x] Update favicon in client/public directory
- [x] Test favicon display across browsers

## Day 1: Custom Authentication System
- [x] Remove Manus OAuth dependencies from server/routers.ts
- [x] Install bcrypt for password hashing
- [x] Create auth.register procedure (email/password with validation)
- [x] Create auth.login procedure (JWT token generation)
- [x] Implement password reset flow (token-based)
- [x] Add email validation and duplicate checking
- [x] Build frontend signup modal component
- [x] Build frontend login modal component
- [x] Add "Remember me" functionality
- [x] Update useAuth hook to use custom auth
- [x] Update tRPC context to verify JWT tokens
- [x] Create toast notification system
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test password reset flow

## Day 1: Customer Account Pages
- [x] Update Account page to remove OAuth dependency
- [x] Implement logout functionality
- [x] Build "Profile Settings" component (UI complete, backend pending)
- [ ] Add backend endpoint for profile updates
- [ ] Add backend endpoint for password change
- [ ] Build "My Orders" page with order history
- [ ] Add "Saved Addresses" management page
- [ ] Add protected route guards for account pages

## Day 2: Admin Dashboard Foundation
- [ ] Create /admin route with role-based access control
- [ ] Build admin layout with sidebar navigation
- [ ] Add admin login page (separate from customer)
- [ ] Implement admin role checking middleware
- [ ] Create dashboard home with key metrics
- [ ] Add sales chart and analytics

## Day 2: Inventory Management
- [ ] Build "Products" admin page with searchable table
- [ ] Create "Add Product" form with image upload
- [ ] Build "Edit Product" functionality
- [ ] Add "Delete Product" with confirmation
- [ ] Implement bulk actions (delete multiple, update stock)
- [ ] Add product variant management (colors, sizes, stock)
- [ ] Test inventory CRUD operations

## Day 2: Order Management
- [ ] Build "Orders" admin page with filterable list
- [ ] Create order detail view (customer info, items, payment)
- [ ] Add order status update functionality
- [ ] Implement order search by customer/email/ID
- [ ] Add "Print Packing Slip" feature
- [ ] Test order management workflow

## Day 3: Shopping Cart
- [ ] Persist cart in localStorage for guest users
- [ ] Sync cart to database for logged-in users
- [ ] Build cart page with quantity adjustment
- [ ] Add "Remove item" and "Clear cart" functionality
- [ ] Calculate subtotal, tax, shipping
- [ ] Add promo code input field

## Day 3: Checkout Flow
- [ ] Build checkout page with multi-step form
- [ ] Add shipping address step (autofill for logged-in)
- [ ] Integrate Stripe Payment Element
- [ ] Add payment method step
- [ ] Build order review step
- [ ] Implement "Continue as Guest" option
- [ ] Add address validation
- [ ] Create order confirmation page

## Day 3: Post-Purchase
- [ ] Build order creation endpoint
- [ ] Implement inventory auto-deduction
- [ ] Add "Out of Stock" prevention
- [ ] Send order confirmation email
- [ ] Add order tracking page for customers
- [ ] Test full checkout flow (guest + logged-in)

## Polish & Testing
- [ ] Add loading states throughout
- [ ] Implement error handling
- [ ] Test edge cases (out of stock, payment failures)
- [ ] Add email notifications for order status
- [ ] Mobile responsiveness check
- [ ] Security audit (SQL injection, XSS prevention)
- [ ] Update React to latest version
- [ ] Write vitest tests for critical flows
