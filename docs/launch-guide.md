# NexaNest Launch Guide

## 1. Architecture Summary
- Framework: Next.js App Router
- Frontend: React Server Components + client components where interactivity is needed
- Data layer: switchable backend (`DATA_BACKEND=json|mongodb`)
- State: localStorage-backed cart/wishlist provider (`components/cart/cart-provider.jsx`)
- Admin: password-protected panel at `/admin/login`
- SEO: per-page metadata, product schema, sitemap, robots
- Growth hooks: GA4, GTM, Meta Pixel, TikTok Pixel, email popup, newsletter forms

## 2. Brand and Audience Configuration
- Update core brand and audience in `lib/site-config.js`.
- Update static marketing copy in `lib/site-data.js`.
- Manage dynamic content/categories/products/orders via admin UI:
  - `/admin/content`
  - `/admin/categories`
  - `/admin/products`
  - `/admin/orders`
- Replace logo files:
  - `public/logo.svg`
  - `app/icon.svg`

## 3. Pages Included
- Homepage: `/`
- Product Catalog: `/catalog`
- Product Detail: `/product/[slug]`
- Cart: `/cart`
- Checkout: `/checkout`
- Account Dashboard: `/account`
- About: `/about`
- Contact: `/contact`
- Track Order: `/track-order`
- FAQ: `/faq`
- Privacy Policy: `/privacy-policy`
- Terms: `/terms`
- Refund Policy: `/refund-policy`

## 4. SEO Checklist
- [x] Unique title and description on each route
- [x] Product JSON-LD schema on product detail pages
- [x] Alt text for all product and hero images
- [x] Dynamic sitemap at `/sitemap.xml`
- [x] Robots policy at `/robots.txt`
- [x] Crawlable links and internal structure

## 5. Analytics and Ad Tracking Setup
1. Copy `.env.example` to `.env.local`.
2. Fill `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`.
3. Deploy and validate events in browser extensions:
   - Google Tag Assistant
   - Meta Pixel Helper
   - TikTok Pixel Helper

## 6. Payments and Checkout Integration Plan
Current implementation provides payment method selection and order flow UI.

To go live:
1. Implement secure backend endpoints/server actions for:
   - Stripe card checkout (`/api/payments/stripe/intent`)
   - PayPal checkout (`/api/payments/paypal/order`, `/api/payments/paypal/capture`)
   - EasyPaisa/JazzCash payment verification
2. Orders are stored through the configured backend (`DATA_BACKEND`).
3. Enforce webhook verification and signature validation:
   - Stripe: `/api/webhooks/stripe`
   - PayPal: `/api/webhooks/paypal`
4. Keep secrets server-side only (never in client bundle).

## 7. Shipping and Tracking Integration Plan
1. Add shipping rules in backend per zone, weight, and flat rates.
2. Integrate courier APIs (TCS, Leopards, etc.) for label generation and tracking updates.
3. Save courier tracking IDs in order records.
4. Tracking page reads live order status from the configured backend (`/api/orders/track`).

## 8. Security and Performance Checklist
- [x] HTTPS ready (configure on hosting)
- [x] Honeypot spam field in contact form
- [x] Cookie consent banner
- [x] Optimized images via `next/image`
- [x] Responsive design for mobile/tablet/desktop
- [ ] Production backup strategy:
  - JSON mode: host-level snapshots + `data/store-db.json` backup
  - MongoDB mode: automated cluster backups + point-in-time restore (if available)
- [ ] WAF/CDN policy tuning in Cloudflare

## 9. Deployment Steps
1. Install dependencies:
   - `npm install`
   - If using MongoDB backend: `npm install mongodb`
2. Build:
   - `npm run build`
3. Start production:
   - `npm run start`
4. Deploy to Vercel or Node hosting with CDN and SSL.
5. Point domain DNS and verify canonical URL.
6. Set admin credentials in environment:
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
7. If switching from JSON to MongoDB:
   - set `DATA_BACKEND=mongodb`
   - set `MONGODB_URI=...`
   - set `MONGODB_DB=...`
   - run `npm run migrate:json-to-mongodb`

## 10. Admin Training Notes
For non-technical product updates:
1. Login to `/admin/login`.
2. Update homepage cards/testimonials in `/admin/content`.
3. Create categories in `/admin/categories`.
4. Add products in `/admin/products` and mark `Published` when ready.
5. Mark `Featured` and `New Arrival` from product create form for homepage sections.
6. Update order statuses and tracking codes from `/admin/orders`.

For scalable operations, move product/order data to a CMS or commerce backend (Shopify headless, Medusa, or custom admin panel).

## 10b. Customer Accounts
- New customer account APIs:
  - `POST /api/account/register`
  - `POST /api/account/login`
  - `POST /api/account/logout`
  - `GET /api/account/me`
  - `GET /api/account/orders`
  - `PATCH /api/account/profile`
  - `POST /api/account/address`
  - `POST /api/account/password`
- Requires `CUSTOMER_SESSION_SECRET` (or falls back to `ADMIN_SESSION_SECRET`).

## 11. Suggested Milestones
- Week 1: Final brand UI and copy refinement
- Week 2: Backend API implementation for auth, orders, payments
- Week 3: Courier integration, QA, analytics validation
- Week 4: Soft launch, ad test campaigns, optimization cycle

## 12. Production Data Migration
- See `docs/production-db-migration.md` for the no-Prisma migration plan.

## 13. Payment Go-Live
- See `docs/payment-go-live-checklist.md` for webhook replay tests, gateway toggles, and rollback.
