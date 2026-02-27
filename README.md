# NexaNest E-Commerce Starter (Next.js)

Conversion-focused storefront inspired by the structure of homducts.pk, customized as a reusable brand-ready e-commerce base.

## Dynamic stack
- Database: switchable backend (`DATA_BACKEND=json|mongodb`)
  - `json`: local file storage (`data/store-db.json`)
  - `mongodb`: single document record in `store_documents`
- Admin panel: `/admin/login` (password protected via env vars)
- Dynamic entities: homepage cards, testimonials, categories, products, orders, contact messages, newsletter leads

## Run locally
```bash
npm install
npm run dev
```

## Build production
```bash
npm run build
npm run start
```

## Core folders
- `app/` routes and page-level metadata
- `components/` reusable UI and cart state provider
- `lib/` brand config, product catalog data, utility functions
- `docs/launch-guide.md` deployment, integration, SEO, and training checklist

## Environment variables
Copy `.env.example` to `.env.local` and fill analytics/payment keys before launch.

## Backend switch (No Prisma)
1. Keep JSON mode (default):
   - `DATA_BACKEND=json`
2. Use MongoDB Compass/local/Atlas:
   - `npm install mongodb`
   - set `DATA_BACKEND=mongodb`
   - set `MONGODB_URI=...`
   - set `MONGODB_DB=...`
3. Optional data migration (JSON -> MongoDB):
   - `npm run migrate:json-to-mongodb`
