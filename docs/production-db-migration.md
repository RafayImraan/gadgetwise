# Production DB Migration Plan (No Prisma, MongoDB)

This project currently uses `data/store-db.json` for storage.  
For public launch, migrate to a managed MongoDB database and keep admin behavior unchanged.

## Recommended Stack
- Database: MongoDB (Atlas, local MongoDB via Compass, or managed provider)
- DB access: official MongoDB Node.js driver (`mongodb`)
- No Prisma required

## Why Migrate
- JSON file storage is not safe for concurrent writes under real traffic.
- Order + inventory consistency needs atomic updates and validation.
- Backups, monitoring, and replication are easier with managed MongoDB.

## Target Collections
- `store_documents` (current single-document model, key=`store-db`)
- Optional future split: `categories`, `products`, `orders`, `order_items`, `hero_cards`, `testimonials`, `contact_messages`, `newsletter_subscribers`, `admin_audit_logs`

## Collection Sketch
```js
// store_documents
{
  key: "store-db",
  value: { /* full storefront JSON document */ },
  updatedAt: ISODate("...")
}
```

## Migration Sequence
1. Create MongoDB connection module (`lib/data-backend.js` already supports this).
2. Keep repository layer unchanged (`lib/storefront-db.js` uses backend adapter).
3. Add feature flag:
   - `DATA_BACKEND=json|mongodb`
4. Keep existing JSON code as fallback while validating MongoDB in staging.
5. Write one-time migration script:
   - read `data/store-db.json`
   - upsert into MongoDB `store_documents` with `key=store-db`
   - verify admin and storefront data loads
6. Switch production `DATA_BACKEND=mongodb`.
7. Disable JSON writes in production.

## Critical Consistency Rules
- Order creation should remain atomic:
  - validate stock before write
  - update products and orders in one document write path
  - reject checkout when stock is insufficient

## Launch Checklist (DB)
- Daily automated backups enabled
- Point-in-time recovery enabled (if provider supports it)
- Slow query profiling enabled
- Readiness/health checks configured
