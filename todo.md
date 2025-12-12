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
