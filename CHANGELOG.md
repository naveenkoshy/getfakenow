# Changelog

## [2026-04-02] Marketplace Parity, CMS PageBuilder, and Security Hardening

### Marketplace Features (Phases 1-17)

21 new database tables added with full backend CRUD (schema + db functions + tRPC endpoints).

| Phase | Feature | Tables Added | Endpoints |
|-------|---------|-------------|-----------|
| 1 | Product Reviews & Ratings | `reviews`, `reviewImages`, `reviewVotes` | Public: submit/edit/delete reviews, vote helpful. Admin: list/approve/reject/respond/delete, stats |
| 2 | Address Book | `addresses` | CRUD addresses, set default, max 10 per user |
| 4 | Stock Ledger | `stockLedger` | Admin: inventory audit trail with sale/restock/adjustment/return entries |
| 5 | Notifications | `notifications` | Create, list, mark read, mark all read, unread count |
| 7 | Shipments & Tracking | `shipments` | Admin: create/update shipments with carrier + tracking number |
| 8 | Tax Rules | `taxRules` | Admin: CRUD tax rules by country/state, auto-apply applicable rate |
| 10 | Stock Alerts | `stockAlerts` | Users subscribe to back-in-stock alerts, admin marks notified |
| 11 | Flash Sales & Vouchers | `flashSales`, `flashSaleProducts`, `vouchers`, `voucherClaims` | Admin: CRUD flash sales + products, CRUD vouchers. Public: active sales, claim/validate vouchers |
| 13 | Admin Roles | `adminRoles` | Admin: CRUD roles with JSON permission sets |
| 15 | Loyalty & Gift Cards | `loyaltyPoints`, `loyaltyTransactions`, `giftCards`, `giftCardTransactions` | Earn/spend loyalty points, create/check/use gift cards |
| 16 | Live Chat | `conversations`, `chatMessages` | User: start conversation, send messages. Admin: list/reply/close conversations |
| 17 | Product Q&A | `productQuestions`, `productAnswers` | Public: ask/answer questions. Admin: moderate questions + answers |

### CMS PageBuilder Integration

- **PageBuilder** (`client/src/components/admin/PageBuilder.tsx`): Drag-and-drop block editor using @dnd-kit. Supports hero, text, image, product grid, video, testimonial, FAQ, CTA, spacer, and custom HTML blocks.
- **TemplateSelector** (`client/src/components/admin/TemplateSelector.tsx`): Pre-built page templates (Landing, About, Contact, Promo, FAQ, Lookbook) that generate starter block layouts.
- **LivePreview** (`client/src/components/admin/LivePreview.tsx`): Real-time preview panel that renders blocks as they're edited.
- **RichTextEditor** (`client/src/components/admin/RichTextEditor.tsx`): Tiptap-based WYSIWYG with headings, bold/italic/underline, links, images, text align, colors, highlights, and tables.
- **EditorToolbar** (`client/src/components/admin/EditorToolbar.tsx`): Toolbar component for the Tiptap editor with formatting buttons.
- **ProductPicker** (`client/src/components/admin/ProductPicker.tsx`): Modal dialog for searching and selecting products by name/slug/ID. Single and multi-select modes.
- **MediaPicker** (`client/src/components/admin/MediaPicker.tsx`): Media library browser with upload, search, and selection.
- **SortableImageGrid** (`client/src/components/admin/SortableImageGrid.tsx`): Drag-and-drop image reordering grid.
- **VariantManager** (`client/src/components/admin/VariantManager.tsx`): Product variant management component.
- **Pages.tsx updated**: Two creation modes (blank rich text vs template-based block editor), smart editor mode detection, block editor badge, split-pane editing with collapsible SEO panel.

### Admin Dashboard Enhancements

- Time range filter (7d / 30d / 90d / All) driving all dashboard queries
- Revenue chart (Recharts AreaChart with gradient fill)
- Top Products widget (ranked list with sales count)
- Activity Feed (scrollable recent activity log)
- Orders by Status (progress bars + horizontal BarChart)
- 6 KPI cards: Revenue, Orders, Products, Customers, Avg Order Value, Orders to Ship

### Admin Reviews Page

- New route: `/admin/reviews`
- Stats cards: pending, approved, rejected, total reviews
- Status filter dropdown + search
- Review list with star ratings, verified purchase badges, review images
- Admin actions: approve, reject, respond (dialog), delete (confirmation)

### Security Hardening

| # | Severity | Fix | Files |
|---|----------|-----|-------|
| 1 | CRITICAL | Environment variable validation — `requireEnv()` throws in production for missing JWT_SECRET (min 32 chars), DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | `server/_core/env.ts` |
| 2 | CRITICAL | Secured `/api/upload-image` — JWT auth check, file extension whitelist (jpg/jpeg/png/gif/webp/svg/avif), 10MB size limit, sanitized error logging | `server/_core/index.ts` |
| 3 | CRITICAL | Security headers — X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS (production), Content-Security-Policy | `server/_core/index.ts` |
| 4 | CRITICAL | CORS whitelist — explicit origin allowlist (siteUrl, localhost:3000, localhost:5173) replacing permissive config | `server/_core/index.ts` |
| 5 | CRITICAL | SameSite cookie changed from `none` to `lax` to prevent CSRF | `server/_core/cookies.ts` |
| 6 | HIGH | Hash reset tokens, email verification tokens, and admin invite tokens with bcrypt before database storage. Verification uses `bcrypt.compare()` against candidates. | `server/auth.ts`, `server/routers.ts` |
| 7 | HIGH | OAuth state parameter validation — cryptographically secure state (`crypto.randomBytes`), stored in httpOnly cookie, validated in callback with `crypto.timingSafeEqual()` | `server/socialAuth.ts` |
| 8 | HIGH | Social OAuth JWT session reduced from 365 days to 7 days | `server/socialAuth.ts` |
| 9 | MEDIUM | Rate limiting — uploads: 20/15min, password reset: 3/15min, email verification: 3/15min per IP | `server/rateLimit.ts` |
| 10 | MEDIUM | Stripe `success_url` / `cancel_url` origin validated against allowlist, falls back to `ENV.siteUrl` | `server/stripe.ts` |
| 11 | MEDIUM | Webhook error messages sanitized — no longer exposes internal error details to client | `server/webhookHandler.ts` |
| 12 | MEDIUM | Customer session max age reduced from 30 days to 7 days (rememberMe), default from 7 days to 24 hours | `server/routers.ts` |

### Other Changes

- **`.env.example`** created — documents all 25+ environment variables with required/optional labels and minimum length requirements
- **`docs/PRD-marketplace-parity.md`** — 20-phase Product Requirements Document for marketplace parity
- **`shared/pageBlocks.ts`** — TypeScript types for all page block types
- **`shared/layoutTemplates.ts`** — Pre-defined layout templates for PageBuilder
- **Dependencies added**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/extension-text-align`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **TypeScript fixes**: Fixed tiptap named export imports, MediaPicker data shape handling, Set iteration compatibility, `setContent` API update

### Build Status

- TypeScript: 0 errors
- Vite build: successful (2,536 modules)
- Tests: 33 passed, 24 failed (all failures are pre-existing DB-dependent integration tests)

### Remaining / Future Work

- **Phase 6**: Abandoned Cart Recovery — email trigger logic (needs cron job)
- **Phase 9**: Scheduled Tasks — node-cron for auto-cancel orders, review request emails, promo expiry
- **Phase 12**: Bulk Import — CSV parser + admin upload endpoint
- **Phase 14**: Search Enhancement — MySQL FULLTEXT index + autocomplete
- **Phase 18**: Multi-currency support
- **Phase 19**: Saved payment methods
- **Phase 20**: Polish and optimization
- Run `pnpm db:push` to apply schema migrations to production database
- Code-split the frontend bundle (currently 2.4MB, Vite warns about chunk size)
