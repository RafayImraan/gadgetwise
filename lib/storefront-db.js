import { testimonials as defaultTestimonials } from "./site-data";
import { readStoreDocument, writeStoreDocument } from "./data-backend";
import { slugify } from "./utils";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.valueOf())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch (error) {
        // ignore and continue with delimiter-based parsing
      }
    }
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function uniqueSlug(existingSlugs, baseSlug) {
  const safeBase = slugify(baseSlug || "item") || "item";
  if (!existingSlugs.has(safeBase)) {
    return safeBase;
  }
  let suffix = 2;
  while (existingSlugs.has(`${safeBase}-${suffix}`)) {
    suffix += 1;
  }
  return `${safeBase}-${suffix}`;
}

function sanitizeCategory(category) {
  const name = String(category?.name || "").trim();
  return {
    id: String(category?.id || makeId("cat")),
    name,
    slug: slugify(category?.slug || name),
    description: String(category?.description || "").trim(),
    image: String(category?.image || "").trim(),
    createdAt: toIsoDate(category?.createdAt),
    updatedAt: toIsoDate(category?.updatedAt || category?.createdAt)
  };
}

function sanitizeProduct(product, categoryIds = new Set()) {
  const name = String(product?.name || "").trim();
  const slug = slugify(product?.slug || name);
  const categoryId = String(product?.categoryId || "");
  const images = normalizeList(product?.images);

  return {
    id: String(product?.id || makeId("prd")),
    slug,
    name,
    sku: String(product?.sku || "").trim(),
    brand: String(product?.brand || "").trim(),
    price: Math.max(0, Math.floor(toNumber(product?.price, 0))),
    compareAtPrice:
      toNumber(product?.compareAtPrice, 0) > 0 ? Math.floor(toNumber(product?.compareAtPrice, 0)) : null,
    rating: clamp(toNumber(product?.rating, 0), 0, 5),
    reviewCount: Math.max(0, Math.floor(toNumber(product?.reviewCount, 0))),
    stock: Math.max(0, Math.floor(toNumber(product?.stock, 0))),
    shortDescription: String(product?.shortDescription || "").trim(),
    description: String(product?.description || "").trim(),
    shippingInfo: String(product?.shippingInfo || "").trim(),
    tags: normalizeList(product?.tags),
    variants: normalizeList(product?.variants),
    features: normalizeList(product?.features),
    badges: normalizeList(product?.badges),
    images,
    isPublished: Boolean(product?.isPublished),
    isFeatured: Boolean(product?.isFeatured),
    isNewArrival: Boolean(product?.isNewArrival),
    categoryId: categoryIds.has(categoryId) ? categoryId : null,
    createdAt: toIsoDate(product?.createdAt),
    updatedAt: toIsoDate(product?.updatedAt || product?.createdAt)
  };
}

function sanitizeOrderItem(item) {
  return {
    id: String(item?.id || makeId("oi")),
    productId: String(item?.productId || ""),
    productSku: String(item?.productSku || ""),
    productName: String(item?.productName || ""),
    variant: item?.variant ? String(item.variant) : null,
    quantity: Math.max(1, Math.floor(toNumber(item?.quantity, 1))),
    unitPrice: Math.max(0, Math.floor(toNumber(item?.unitPrice, 0))),
    total: Math.max(0, Math.floor(toNumber(item?.total, 0)))
  };
}

function sanitizeOrder(order) {
  const statusHistory = Array.isArray(order?.statusHistory)
    ? order.statusHistory.map((entry) => ({
        status: String(entry?.status || "").trim(),
        note: String(entry?.note || "").trim(),
        at: toIsoDate(entry?.at || order?.updatedAt || order?.createdAt)
      }))
    : [];

  return {
    id: String(order?.id || makeId("ord")),
    orderNumber: String(order?.orderNumber || "").trim(),
    customerName: String(order?.customerName || "").trim(),
    customerEmail: String(order?.customerEmail || "").trim(),
    customerPhone: String(order?.customerPhone || "").trim(),
    city: String(order?.city || "").trim(),
    shippingAddress: String(order?.shippingAddress || "").trim(),
    billingAddress: order?.billingAddress ? String(order.billingAddress).trim() : null,
    deliveryOption: String(order?.deliveryOption || "standard"),
    paymentMethod: String(order?.paymentMethod || "Cash on Delivery"),
    paymentStatus: String(order?.paymentStatus || "pending"),
    paymentReference: order?.paymentReference ? String(order.paymentReference).trim() : null,
    status: String(order?.status || "Order Confirmed"),
    trackingCode: order?.trackingCode ? String(order.trackingCode).trim() : null,
    statusHistory:
      statusHistory.length > 0
        ? statusHistory
        : [
            {
              status: String(order?.status || "Order Confirmed"),
              note: "Order created",
              at: toIsoDate(order?.createdAt)
            }
          ],
    subtotal: Math.max(0, Math.floor(toNumber(order?.subtotal, 0))),
    shippingFee: Math.max(0, Math.floor(toNumber(order?.shippingFee, 0))),
    total: Math.max(0, Math.floor(toNumber(order?.total, 0))),
    items: Array.isArray(order?.items) ? order.items.map(sanitizeOrderItem) : [],
    createdAt: toIsoDate(order?.createdAt),
    updatedAt: toIsoDate(order?.updatedAt || order?.createdAt)
  };
}

function sanitizeAdminAuditLog(entry) {
  return {
    id: String(entry?.id || makeId("audit")),
    actor: String(entry?.actor || "admin").trim(),
    action: String(entry?.action || "unknown").trim(),
    scope: String(entry?.scope || "system").trim(),
    targetId: entry?.targetId ? String(entry.targetId).trim() : null,
    meta: entry?.meta && typeof entry.meta === "object" ? clone(entry.meta) : {},
    createdAt: toIsoDate(entry?.createdAt)
  };
}

function sanitizeContactMessage(message) {
  return {
    id: String(message?.id || makeId("msg")),
    name: String(message?.name || "").trim(),
    email: String(message?.email || "").trim(),
    phone: message?.phone ? String(message.phone).trim() : null,
    message: String(message?.message || "").trim(),
    createdAt: toIsoDate(message?.createdAt)
  };
}

function sanitizeNewsletterSubscriber(subscriber) {
  return {
    id: String(subscriber?.id || makeId("sub")),
    email: String(subscriber?.email || "").trim().toLowerCase(),
    source: String(subscriber?.source || "website").trim(),
    createdAt: toIsoDate(subscriber?.createdAt),
    updatedAt: toIsoDate(subscriber?.updatedAt || subscriber?.createdAt)
  };
}

function sanitizeCustomer(customer) {
  const addresses = Array.isArray(customer?.addresses)
    ? customer.addresses
        .map((item) => ({
          id: String(item?.id || makeId("addr")),
          label: String(item?.label || "").trim(),
          recipientName: String(item?.recipientName || "").trim(),
          phone: String(item?.phone || "").trim(),
          city: String(item?.city || "").trim(),
          address: String(item?.address || "").trim(),
          isDefault: Boolean(item?.isDefault)
        }))
        .filter((item) => item.recipientName && item.phone && item.address)
    : [];

  return {
    id: String(customer?.id || makeId("cus")),
    fullName: String(customer?.fullName || "").trim(),
    email: String(customer?.email || "").trim().toLowerCase(),
    phone: String(customer?.phone || "").trim(),
    passwordHash: String(customer?.passwordHash || ""),
    preferredLanguage: String(customer?.preferredLanguage || "English").trim(),
    addresses,
    createdAt: toIsoDate(customer?.createdAt),
    updatedAt: toIsoDate(customer?.updatedAt || customer?.createdAt)
  };
}

function sanitizeHeroCard(card) {
  return {
    id: String(card?.id || makeId("hero")),
    title: String(card?.title || "").trim(),
    subtitle: String(card?.subtitle || "").trim(),
    ctaLabel: String(card?.ctaLabel || "Explore").trim(),
    ctaHref: String(card?.ctaHref || "/catalog").trim(),
    image: String(card?.image || "").trim(),
    createdAt: toIsoDate(card?.createdAt),
    updatedAt: toIsoDate(card?.updatedAt || card?.createdAt)
  };
}

function sanitizeTestimonial(item) {
  return {
    id: String(item?.id || makeId("testi")),
    name: String(item?.name || "").trim(),
    city: String(item?.city || "").trim(),
    quote: String(item?.quote || "").trim(),
    createdAt: toIsoDate(item?.createdAt),
    updatedAt: toIsoDate(item?.updatedAt || item?.createdAt)
  };
}

function withProductCategories(productList, categoryList) {
  const categoryById = new Map(categoryList.map((category) => [category.id, category]));
  return productList.map((product) => ({
    ...product,
    category: product.categoryId ? categoryById.get(product.categoryId) || null : null
  }));
}

function sortByCreatedDesc(list) {
  return [...list].sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
}

function buildDefaultDb() {
  return {
    categories: [],
    products: [],
    orders: [],
    contactMessages: [],
    newsletterSubscribers: [],
    customers: [],
    adminAuditLogs: [],
    heroCards: [],
    testimonials: clone(defaultTestimonials).map((item) => sanitizeTestimonial(item))
  };
}

function sanitizeDb(db) {
  const input = db && typeof db === "object" ? db : {};
  const categoriesList = Array.isArray(input.categories) ? input.categories.map(sanitizeCategory) : [];
  const categoryIds = new Set(categoriesList.map((category) => category.id));
  const productsList = Array.isArray(input.products)
    ? input.products.map((product) => sanitizeProduct(product, categoryIds))
    : [];
  const ordersList = Array.isArray(input.orders) ? input.orders.map(sanitizeOrder) : [];
  const contactMessagesList = Array.isArray(input.contactMessages)
    ? input.contactMessages.map(sanitizeContactMessage)
    : [];
  const subscribersList = Array.isArray(input.newsletterSubscribers)
    ? input.newsletterSubscribers.map(sanitizeNewsletterSubscriber)
    : [];
  const customersList = Array.isArray(input.customers) ? input.customers.map(sanitizeCustomer) : [];
  const adminAuditLogsList = Array.isArray(input.adminAuditLogs)
    ? input.adminAuditLogs.map(sanitizeAdminAuditLog)
    : [];
  const heroCardsList = Array.isArray(input.heroCards)
    ? input.heroCards.map(sanitizeHeroCard).filter((card) => card.title && card.image)
    : [];
  const testimonialsList = Array.isArray(input.testimonials)
    ? input.testimonials.map(sanitizeTestimonial).filter((item) => item.name && item.quote)
    : [];

  return {
    categories: categoriesList,
    products: productsList,
    orders: ordersList,
    contactMessages: contactMessagesList,
    newsletterSubscribers: subscribersList,
    customers: customersList,
    adminAuditLogs: adminAuditLogsList,
    heroCards: heroCardsList,
    testimonials: testimonialsList.length
      ? testimonialsList
      : clone(defaultTestimonials).map(sanitizeTestimonial)
  };
}

async function writeDb(db) {
  await writeStoreDocument(sanitizeDb(db));
}

async function ensureDbFile() {
  const existing = await readStoreDocument();
  if (existing == null) {
    await writeDb(buildDefaultDb());
  }
}

async function readDb() {
  await ensureDbFile();
  try {
    const raw = await readStoreDocument();
    if (raw == null) {
      const reset = buildDefaultDb();
      await writeDb(reset);
      return reset;
    }
    return sanitizeDb(raw);
  } catch (error) {
    const reset = buildDefaultDb();
    await writeDb(reset);
    return reset;
  }
}


export async function getPublicCategories(limit) {
  const db = await readDb();
  return typeof limit === "number" ? db.categories.slice(0, limit) : db.categories;
}

export async function getFeaturedProducts(limit = 8) {
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  return productsWithCategories
    .filter((product) => product.isPublished && product.isFeatured)
    .slice(0, limit);
}

export async function getNewArrivalProducts(limit = 8) {
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  const newArrivals = productsWithCategories.filter(
    (product) => product.isPublished && product.isNewArrival
  );
  if (newArrivals.length) {
    return newArrivals.slice(0, limit);
  }
  return productsWithCategories.filter((product) => product.isPublished).slice(0, limit);
}

export async function getCatalogProducts() {
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  return productsWithCategories.filter((product) => product.isPublished);
}

export async function getProductBySlug(slug) {
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  return productsWithCategories.find((product) => product.slug === slug && product.isPublished) || null;
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product?.categoryId) {
    return [];
  }
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  return productsWithCategories
    .filter(
      (item) =>
        item.isPublished && item.slug !== product.slug && item.categoryId === product.categoryId
    )
    .slice(0, limit);
}

export async function getAllProductSlugs() {
  const db = await readDb();
  return db.products.filter((product) => product.isPublished).map((product) => product.slug);
}

export async function getWishlistProductsBySlugs(slugs) {
  if (!Array.isArray(slugs) || !slugs.length) {
    return [];
  }
  const db = await readDb();
  const productsWithCategories = withProductCategories(db.products, db.categories);
  return productsWithCategories.filter((product) => product.isPublished && slugs.includes(product.slug));
}

export async function getSitemapProductEntries() {
  const db = await readDb();
  return db.products
    .filter((product) => product.isPublished)
    .map((product) => ({
      slug: product.slug,
      updatedAt: product.updatedAt || product.createdAt
    }));
}

export async function getDashboardCounts() {
  const db = await readDb();
  return {
    categories: db.categories.length,
    products: db.products.length,
    orders: db.orders.length,
    contactMessages: db.contactMessages.length,
    newsletterSubscribers: db.newsletterSubscribers.length
  };
}

export async function getAdminAuditLogs(limit = 100) {
  const db = await readDb();
  const logs = sortByCreatedDesc(db.adminAuditLogs || []);
  return typeof limit === "number" ? logs.slice(0, limit) : logs;
}

export async function createAdminAuditLog({ actor = "admin", action, scope, targetId, meta }) {
  const safeAction = String(action || "").trim();
  if (!safeAction) {
    return null;
  }

  const db = await readDb();
  const entry = sanitizeAdminAuditLog({
    id: makeId("audit"),
    actor,
    action: safeAction,
    scope: String(scope || "system").trim(),
    targetId: targetId ? String(targetId).trim() : null,
    meta: meta && typeof meta === "object" ? meta : {},
    createdAt: toIsoDate()
  });

  db.adminAuditLogs.unshift(entry);
  if (db.adminAuditLogs.length > 1000) {
    db.adminAuditLogs = db.adminAuditLogs.slice(0, 1000);
  }
  await writeDb(db);
  return entry;
}

export async function getAdminCategories() {
  const db = await readDb();
  return sortByCreatedDesc(db.categories);
}

export async function createCategory({ name, description, image }) {
  const safeName = String(name || "").trim();
  if (!safeName) {
    return null;
  }

  const db = await readDb();
  const usedSlugs = new Set(db.categories.map((category) => category.slug));
  const slug = uniqueSlug(usedSlugs, safeName);
  const now = toIsoDate();
  const category = sanitizeCategory({
    id: makeId("cat"),
    name: safeName,
    slug,
    description: String(description || "").trim(),
    image: String(image || "").trim(),
    createdAt: now,
    updatedAt: now
  });

  db.categories.unshift(category);
  await writeDb(db);
  return category;
}

export async function deleteCategory(categoryId) {
  const id = String(categoryId || "").trim();
  if (!id) {
    return;
  }

  const db = await readDb();
  db.categories = db.categories.filter((category) => category.id !== id);
  db.products = db.products.map((product) =>
    product.categoryId === id
      ? {
          ...product,
          categoryId: null,
          updatedAt: toIsoDate()
        }
      : product
  );
  await writeDb(db);
}

export async function updateCategory(categoryId, { name, description, image }) {
  const id = String(categoryId || "").trim();
  const safeName = String(name || "").trim();
  if (!id || !safeName) {
    return null;
  }

  const db = await readDb();
  const index = db.categories.findIndex((category) => category.id === id);
  if (index === -1) {
    return null;
  }

  const usedSlugs = new Set(
    db.categories.filter((category) => category.id !== id).map((category) => category.slug)
  );
  const slug = uniqueSlug(usedSlugs, safeName);
  const now = toIsoDate();

  db.categories[index] = sanitizeCategory({
    ...db.categories[index],
    name: safeName,
    slug,
    description: String(description || "").trim(),
    image: String(image || "").trim(),
    updatedAt: now
  });

  await writeDb(db);
  return db.categories[index];
}

export async function getAdminProducts() {
  const db = await readDb();
  return sortByCreatedDesc(withProductCategories(db.products, db.categories));
}

export async function createProduct(input) {
  const name = String(input?.name || "").trim();
  const sku = String(input?.sku || "").trim();
  const price = Math.max(0, Math.floor(toNumber(input?.price, 0)));

  if (!name || !sku || price <= 0) {
    return null;
  }

  const db = await readDb();
  const categoryIds = new Set(db.categories.map((category) => category.id));
  const usedSlugs = new Set(db.products.map((product) => product.slug));
  const slug = uniqueSlug(usedSlugs, String(input?.slug || name));
  const now = toIsoDate();

  const product = sanitizeProduct(
    {
      id: makeId("prd"),
      ...input,
      slug,
      createdAt: now,
      updatedAt: now
    },
    categoryIds
  );

  db.products.unshift(product);
  await writeDb(db);
  return product;
}

export async function deleteProduct(productId) {
  const id = String(productId || "").trim();
  if (!id) {
    return;
  }

  const db = await readDb();
  db.products = db.products.filter((product) => product.id !== id);
  await writeDb(db);
}

export async function toggleProductPublished(productId) {
  const id = String(productId || "").trim();
  if (!id) {
    return;
  }

  const db = await readDb();
  const index = db.products.findIndex((product) => product.id === id);
  if (index === -1) {
    return;
  }

  db.products[index] = {
    ...db.products[index],
    isPublished: !db.products[index].isPublished,
    updatedAt: toIsoDate()
  };
  await writeDb(db);
}

export async function updateProduct(productId, input) {
  const id = String(productId || "").trim();
  const name = String(input?.name || "").trim();
  const sku = String(input?.sku || "").trim();
  const price = Math.max(0, Math.floor(toNumber(input?.price, 0)));
  if (!id || !name || !sku || price <= 0) {
    return null;
  }

  const db = await readDb();
  const index = db.products.findIndex((product) => product.id === id);
  if (index === -1) {
    return null;
  }

  const categoryIds = new Set(db.categories.map((category) => category.id));
  const usedSlugs = new Set(
    db.products.filter((product) => product.id !== id).map((product) => product.slug)
  );
  const slug = uniqueSlug(usedSlugs, String(input?.slug || name));
  const now = toIsoDate();

  db.products[index] = sanitizeProduct(
    {
      ...db.products[index],
      ...input,
      slug,
      updatedAt: now
    },
    categoryIds
  );

  await writeDb(db);
  return db.products[index];
}

export async function getPublishedProductsBySlugs(slugs) {
  if (!Array.isArray(slugs) || !slugs.length) {
    return [];
  }

  const db = await readDb();
  const wanted = new Set(slugs.map((slug) => String(slug)));
  return db.products.filter((product) => product.isPublished && wanted.has(product.slug));
}

export async function orderNumberExists(orderNumber) {
  const value = String(orderNumber || "").trim();
  if (!value) {
    return false;
  }

  const db = await readDb();
  return db.orders.some((order) => order.orderNumber === value);
}

export async function createOrder(input) {
  const db = await readDb();
  const now = toIsoDate();
  const order = sanitizeOrder({
    id: makeId("ord"),
    ...input,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: String(input?.status || "Order Confirmed"),
        note: "Order created",
        at: now
      }
    ]
  });

  db.orders.unshift(order);
  await writeDb(db);
  return order;
}

export async function createOrderWithInventoryLock(input) {
  const orderInput = input && typeof input === "object" ? input : {};
  const orderItems = Array.isArray(orderInput.items) ? orderInput.items : [];
  if (!orderItems.length) {
    return { order: null, error: "No valid products found in cart." };
  }

  const db = await readDb();
  const productIndexById = new Map(db.products.map((product, index) => [product.id, index]));
  const reservedQtyByProductId = new Map();

  for (const item of orderItems) {
    const productId = String(item?.productId || "").trim();
    const qty = Math.max(1, Math.floor(toNumber(item?.quantity, 1)));
    if (!productId || qty <= 0) {
      return { order: null, error: "Invalid order item payload." };
    }
    const current = reservedQtyByProductId.get(productId) || 0;
    reservedQtyByProductId.set(productId, current + qty);
  }

  for (const [productId, qty] of reservedQtyByProductId.entries()) {
    const productIndex = productIndexById.get(productId);
    if (productIndex === undefined) {
      return { order: null, error: "A product in the cart is no longer available." };
    }
    const product = db.products[productIndex];
    if (!product.isPublished) {
      return { order: null, error: `${product.name} is no longer published.` };
    }
    if (product.stock < qty) {
      return {
        order: null,
        error: `${product.name} has only ${product.stock} item(s) left in stock.`
      };
    }
  }

  const now = toIsoDate();
  const order = sanitizeOrder({
    id: makeId("ord"),
    ...orderInput,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        status: String(orderInput?.status || "Order Confirmed"),
        note: "Order created",
        at: now
      }
    ]
  });

  for (const [productId, qty] of reservedQtyByProductId.entries()) {
    const productIndex = productIndexById.get(productId);
    const product = db.products[productIndex];
    db.products[productIndex] = sanitizeProduct(
      {
        ...product,
        stock: Math.max(0, product.stock - qty),
        updatedAt: now
      },
      new Set(db.categories.map((category) => category.id))
    );
  }

  db.orders.unshift(order);
  await writeDb(db);
  return { order, error: null };
}

export async function getAdminOrders() {
  const db = await readDb();
  return sortByCreatedDesc(db.orders);
}

export async function updateOrderStatus(orderId, { status, trackingCode }) {
  const id = String(orderId || "").trim();
  const safeStatus = String(status || "").trim();
  if (!id || !safeStatus) {
    return;
  }

  const db = await readDb();
  const index = db.orders.findIndex((order) => order.id === id);
  if (index === -1) {
    return;
  }

  const current = db.orders[index];
  const nextHistory =
    safeStatus !== current.status
      ? [
          ...(Array.isArray(current.statusHistory) ? current.statusHistory : []),
          {
            status: safeStatus,
            note: "Updated by admin",
            at: toIsoDate()
          }
        ]
      : Array.isArray(current.statusHistory)
        ? current.statusHistory
        : [];

  db.orders[index] = sanitizeOrder({
    ...current,
    status: safeStatus,
    trackingCode: trackingCode ? String(trackingCode).trim() : null,
    statusHistory: nextHistory,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
}

export async function updateOrderPayment(orderId, { paymentStatus, paymentReference, paymentMethod }) {
  const id = String(orderId || "").trim();
  const safeStatus = String(paymentStatus || "").trim();
  if (!id || !safeStatus) {
    return null;
  }

  const db = await readDb();
  const index = db.orders.findIndex((order) => order.id === id);
  if (index === -1) {
    return null;
  }

  db.orders[index] = sanitizeOrder({
    ...db.orders[index],
    paymentStatus: safeStatus,
    paymentReference: paymentReference ? String(paymentReference).trim() : db.orders[index].paymentReference,
    paymentMethod: paymentMethod ? String(paymentMethod).trim() : db.orders[index].paymentMethod,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.orders[index];
}

export async function updateOrderPaymentByOrderNumber(
  orderNumber,
  { paymentStatus, paymentReference, paymentMethod }
) {
  const safeOrderNumber = String(orderNumber || "").trim();
  const safeStatus = String(paymentStatus || "").trim();
  if (!safeOrderNumber || !safeStatus) {
    return null;
  }

  const db = await readDb();
  const index = db.orders.findIndex((order) => order.orderNumber === safeOrderNumber);
  if (index === -1) {
    return null;
  }

  db.orders[index] = sanitizeOrder({
    ...db.orders[index],
    paymentStatus: safeStatus,
    paymentReference: paymentReference ? String(paymentReference).trim() : db.orders[index].paymentReference,
    paymentMethod: paymentMethod ? String(paymentMethod).trim() : db.orders[index].paymentMethod,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.orders[index];
}

export async function updateOrderPaymentByReference(
  paymentReference,
  { paymentStatus, paymentMethod, orderNumber }
) {
  const safeReference = String(paymentReference || "").trim();
  const safeStatus = String(paymentStatus || "").trim();
  if (!safeReference || !safeStatus) {
    return null;
  }

  const db = await readDb();
  const index = db.orders.findIndex((order) => order.paymentReference === safeReference);
  if (index === -1) {
    return null;
  }

  db.orders[index] = sanitizeOrder({
    ...db.orders[index],
    paymentStatus: safeStatus,
    paymentMethod: paymentMethod ? String(paymentMethod).trim() : db.orders[index].paymentMethod,
    orderNumber: orderNumber ? String(orderNumber).trim() : db.orders[index].orderNumber,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.orders[index];
}

export async function findTrackedOrder(orderNumber, phone) {
  const safeOrderNumber = String(orderNumber || "").trim();
  const safePhone = String(phone || "").trim();
  if (!safeOrderNumber || !safePhone) {
    return null;
  }

  const db = await readDb();
  return (
    db.orders.find(
      (order) => order.orderNumber === safeOrderNumber && order.customerPhone === safePhone
    ) || null
  );
}

export async function createContactMessage({ name, email, phone, message }) {
  const safeName = String(name || "").trim();
  const safeEmail = String(email || "").trim();
  const safeMessage = String(message || "").trim();
  if (!safeName || !safeEmail || !safeMessage) {
    return null;
  }

  const db = await readDb();
  const entry = sanitizeContactMessage({
    id: makeId("msg"),
    name: safeName,
    email: safeEmail,
    phone: phone ? String(phone).trim() : null,
    message: safeMessage,
    createdAt: toIsoDate()
  });

  db.contactMessages.unshift(entry);
  await writeDb(db);
  return entry;
}

export async function upsertNewsletterSubscriber({ email, source }) {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) {
    return null;
  }

  const db = await readDb();
  const now = toIsoDate();
  const index = db.newsletterSubscribers.findIndex((item) => item.email === safeEmail);

  if (index === -1) {
    const entry = sanitizeNewsletterSubscriber({
      id: makeId("sub"),
      email: safeEmail,
      source: String(source || "website").trim(),
      createdAt: now,
      updatedAt: now
    });
    db.newsletterSubscribers.unshift(entry);
    await writeDb(db);
    return entry;
  }

  db.newsletterSubscribers[index] = sanitizeNewsletterSubscriber({
    ...db.newsletterSubscribers[index],
    source: String(source || "website").trim(),
    updatedAt: now
  });
  await writeDb(db);
  return db.newsletterSubscribers[index];
}

export async function getCustomerByEmail(email) {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) {
    return null;
  }
  const db = await readDb();
  return db.customers.find((item) => item.email === safeEmail) || null;
}

export async function getCustomerById(customerId) {
  const id = String(customerId || "").trim();
  if (!id) {
    return null;
  }
  const db = await readDb();
  return db.customers.find((item) => item.id === id) || null;
}

export async function createCustomerAccount({
  fullName,
  email,
  phone,
  passwordHash,
  preferredLanguage = "English"
}) {
  const safeName = String(fullName || "").trim();
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeName || !safeEmail || !passwordHash) {
    return null;
  }

  const db = await readDb();
  if (db.customers.some((item) => item.email === safeEmail)) {
    return null;
  }

  const now = toIsoDate();
  const customer = sanitizeCustomer({
    id: makeId("cus"),
    fullName: safeName,
    email: safeEmail,
    phone: String(phone || "").trim(),
    passwordHash: String(passwordHash),
    preferredLanguage: String(preferredLanguage || "English").trim(),
    addresses: [],
    createdAt: now,
    updatedAt: now
  });
  db.customers.unshift(customer);
  await writeDb(db);
  return customer;
}

export async function updateCustomerProfile(customerId, input) {
  const id = String(customerId || "").trim();
  if (!id) {
    return null;
  }
  const db = await readDb();
  const index = db.customers.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const current = db.customers[index];
  db.customers[index] = sanitizeCustomer({
    ...current,
    fullName: String(input?.fullName || current.fullName).trim(),
    phone: String(input?.phone || current.phone).trim(),
    preferredLanguage: String(input?.preferredLanguage || current.preferredLanguage).trim(),
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.customers[index];
}

export async function updateCustomerPassword(customerId, passwordHash) {
  const id = String(customerId || "").trim();
  const hash = String(passwordHash || "").trim();
  if (!id || !hash) {
    return null;
  }
  const db = await readDb();
  const index = db.customers.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  db.customers[index] = sanitizeCustomer({
    ...db.customers[index],
    passwordHash: hash,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.customers[index];
}

export async function upsertCustomerAddress(customerId, addressInput) {
  const id = String(customerId || "").trim();
  if (!id) {
    return null;
  }
  const db = await readDb();
  const index = db.customers.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const current = db.customers[index];
  const label = String(addressInput?.label || "").trim();
  const recipientName = String(addressInput?.recipientName || "").trim();
  const phone = String(addressInput?.phone || "").trim();
  const city = String(addressInput?.city || "").trim();
  const address = String(addressInput?.address || "").trim();
  if (!recipientName || !phone || !address) {
    return null;
  }
  const isDefault = Boolean(addressInput?.isDefault);
  const addressId = String(addressInput?.id || "").trim();

  let addresses = Array.isArray(current.addresses) ? [...current.addresses] : [];
  if (isDefault) {
    addresses = addresses.map((item) => ({ ...item, isDefault: false }));
  }

  const nextAddress = {
    id: addressId || makeId("addr"),
    label,
    recipientName,
    phone,
    city,
    address,
    isDefault
  };

  const addrIndex = addresses.findIndex((item) => item.id === nextAddress.id);
  if (addrIndex === -1) {
    addresses.unshift(nextAddress);
  } else {
    addresses[addrIndex] = nextAddress;
  }

  db.customers[index] = sanitizeCustomer({
    ...current,
    addresses,
    updatedAt: toIsoDate()
  });
  await writeDb(db);
  return db.customers[index];
}

export async function getOrdersByCustomerEmail(email) {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) {
    return [];
  }
  const db = await readDb();
  return sortByCreatedDesc(
    db.orders.filter((order) => String(order.customerEmail || "").trim().toLowerCase() === safeEmail)
  );
}

export async function getHeroCards() {
  const db = await readDb();
  return db.heroCards;
}

export async function createHeroCard({ title, subtitle, ctaLabel, ctaHref, image }) {
  const safeTitle = String(title || "").trim();
  const safeImage = String(image || "").trim();
  if (!safeTitle || !safeImage) {
    return null;
  }

  const db = await readDb();
  const now = toIsoDate();
  const card = sanitizeHeroCard({
    id: makeId("hero"),
    title: safeTitle,
    subtitle: String(subtitle || "").trim(),
    ctaLabel: String(ctaLabel || "Explore").trim(),
    ctaHref: String(ctaHref || "/catalog").trim(),
    image: safeImage,
    createdAt: now,
    updatedAt: now
  });

  db.heroCards.push(card);
  await writeDb(db);
  return card;
}

export async function deleteHeroCard(cardId) {
  const id = String(cardId || "").trim();
  if (!id) {
    return;
  }

  const db = await readDb();
  if (db.heroCards.length <= 1) {
    return;
  }
  db.heroCards = db.heroCards.filter((card) => card.id !== id);
  await writeDb(db);
}

export async function updateHeroCard(cardId, { title, subtitle, ctaLabel, ctaHref, image }) {
  const id = String(cardId || "").trim();
  const safeTitle = String(title || "").trim();
  const safeImage = String(image || "").trim();
  if (!id || !safeTitle || !safeImage) {
    return null;
  }

  const db = await readDb();
  const index = db.heroCards.findIndex((card) => card.id === id);
  if (index === -1) {
    return null;
  }

  db.heroCards[index] = sanitizeHeroCard({
    ...db.heroCards[index],
    title: safeTitle,
    subtitle: String(subtitle || "").trim(),
    ctaLabel: String(ctaLabel || "Explore").trim(),
    ctaHref: String(ctaHref || "/catalog").trim(),
    image: safeImage,
    updatedAt: toIsoDate()
  });

  await writeDb(db);
  return db.heroCards[index];
}

export async function getTestimonials() {
  const db = await readDb();
  return db.testimonials;
}

export async function createTestimonial({ name, city, quote }) {
  const safeName = String(name || "").trim();
  const safeQuote = String(quote || "").trim();
  if (!safeName || !safeQuote) {
    return null;
  }

  const db = await readDb();
  const now = toIsoDate();
  const testimonial = sanitizeTestimonial({
    id: makeId("testi"),
    name: safeName,
    city: String(city || "").trim(),
    quote: safeQuote,
    createdAt: now,
    updatedAt: now
  });

  db.testimonials.push(testimonial);
  await writeDb(db);
  return testimonial;
}

export async function deleteTestimonial(testimonialId) {
  const id = String(testimonialId || "").trim();
  if (!id) {
    return;
  }

  const db = await readDb();
  if (db.testimonials.length <= 1) {
    return;
  }
  db.testimonials = db.testimonials.filter((item) => item.id !== id);
  await writeDb(db);
}

export async function updateTestimonial(testimonialId, { name, city, quote }) {
  const id = String(testimonialId || "").trim();
  const safeName = String(name || "").trim();
  const safeQuote = String(quote || "").trim();
  if (!id || !safeName || !safeQuote) {
    return null;
  }

  const db = await readDb();
  const index = db.testimonials.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  db.testimonials[index] = sanitizeTestimonial({
    ...db.testimonials[index],
    name: safeName,
    city: String(city || "").trim(),
    quote: safeQuote,
    updatedAt: toIsoDate()
  });

  await writeDb(db);
  return db.testimonials[index];
}

export async function seedDemoStoreContent() {
  const db = await readDb();
  const now = toIsoDate();
  const normalizeKey = (value) => String(value || "").trim().toLowerCase();

  const seedCategories = [
    {
      key: "drinkware",
      name: "Drinkware",
      description: "Luxury tumblers, thermal bottles, and premium sipware for daily routines.",
      image: "/images/carousel/slide-1.jpeg"
    },
    {
      key: "home-decor",
      name: "Home & Decor",
      description: "Elegant accents that upgrade your living spaces with modern style.",
      image: "/images/carousel/slide-2.jpeg"
    },
    {
      key: "kitchenware",
      name: "Kitchenware",
      description: "Functional kitchen essentials designed for quality and durability.",
      image: "/images/carousel/slide-3.jpeg"
    }
  ];

  const categoryByKey = new Map();
  const usedCategorySlugs = new Set(db.categories.map((category) => category.slug));
  let categoriesAdded = 0;

  seedCategories.forEach((sample) => {
    const existing = db.categories.find(
      (category) => normalizeKey(category.name) === normalizeKey(sample.name)
    );
    if (existing) {
      categoryByKey.set(sample.key, existing.id);
      return;
    }

    const slug = uniqueSlug(usedCategorySlugs, sample.name);
    usedCategorySlugs.add(slug);
    const category = sanitizeCategory({
      id: makeId("cat"),
      name: sample.name,
      slug,
      description: sample.description,
      image: sample.image,
      createdAt: now,
      updatedAt: now
    });
    db.categories.unshift(category);
    categoryByKey.set(sample.key, category.id);
    categoriesAdded += 1;
  });

  seedCategories.forEach((sample) => {
    if (categoryByKey.has(sample.key)) {
      return;
    }
    const fallback = db.categories.find((category) => normalizeKey(category.slug) === sample.key);
    if (fallback) {
      categoryByKey.set(sample.key, fallback.id);
    }
  });

  const seedProducts = [
    {
      name: "Regal Steel Tumbler 900ml",
      sku: "NN-LX-DR-001",
      brand: "NexaNest Luxe",
      price: 3299,
      compareAtPrice: 3999,
      rating: 4.8,
      reviewCount: 124,
      stock: 38,
      shortDescription: "Insulated tumbler with all-day temperature hold.",
      description:
        "A statement steel tumbler crafted for both style and performance, keeping drinks cold or hot for long hours.",
      shippingInfo: "Ships in 24 hours. Delivery 2-4 working days in major cities.",
      tags: ["drinkware", "insulated", "luxe"],
      variants: ["Ruby Red", "Matte Black"],
      features: [
        "18/8 stainless steel body",
        "Leak-resistant lid",
        "Comfort-grip handle",
        "Fits most car cup holders"
      ],
      badges: ["Best Seller", "Fast Shipping"],
      images: ["/images/carousel/slide-1.jpeg", "/images/carousel/slide-2.jpeg"],
      isPublished: true,
      isFeatured: true,
      isNewArrival: true,
      categoryKey: "drinkware"
    },
    {
      name: "Aurora Aroma Diffuser Set",
      sku: "NN-LX-HD-002",
      brand: "NexaNest Luxe",
      price: 4299,
      compareAtPrice: 5199,
      rating: 4.7,
      reviewCount: 87,
      stock: 24,
      shortDescription: "Premium diffuser set for warm ambience and calm evenings.",
      description:
        "A curated decor diffuser set that blends scent, design, and soft illumination to elevate your room atmosphere.",
      shippingInfo: "Ships in 24-48 hours. Protected packaging for fragile decor items.",
      tags: ["decor", "aroma", "home"],
      variants: ["Amber Glass", "Smoked Bronze"],
      features: [
        "Low-noise mist technology",
        "Ambient warm light mode",
        "Auto shut-off safety",
        "Gift-ready packaging"
      ],
      badges: ["Premium Pick"],
      images: ["/images/carousel/slide-2.jpeg", "/images/carousel/slide-3.jpeg"],
      isPublished: true,
      isFeatured: true,
      isNewArrival: true,
      categoryKey: "home-decor"
    },
    {
      name: "Chef Precision Oil Bottle Duo",
      sku: "NN-LX-KW-003",
      brand: "NexaNest Luxe",
      price: 1799,
      compareAtPrice: 2299,
      rating: 4.6,
      reviewCount: 59,
      stock: 52,
      shortDescription: "Elegant oil dispensers with drip-control nozzles.",
      description:
        "A kitchen duo designed for clean pouring and premium countertop appeal, ideal for oils, vinegar, and dressings.",
      shippingInfo: "Ships same day for Karachi and Lahore. Nationwide dispatch available.",
      tags: ["kitchenware", "bottle", "cooking"],
      variants: ["Gold Cap", "Brushed Steel"],
      features: [
        "No-drip precision spout",
        "Food-grade glass body",
        "Easy refill neck",
        "Anti-slip base ring"
      ],
      badges: ["Kitchen Essential"],
      images: ["/images/carousel/slide-3.jpeg", "/images/carousel/slide-1.jpeg"],
      isPublished: true,
      isFeatured: true,
      isNewArrival: false,
      categoryKey: "kitchenware"
    }
  ];

  const usedProductSlugs = new Set(db.products.map((product) => product.slug));
  let productsAdded = 0;

  seedProducts.forEach((sample) => {
    const exists = db.products.some(
      (product) =>
        normalizeKey(product.sku) === normalizeKey(sample.sku) ||
        normalizeKey(product.name) === normalizeKey(sample.name)
    );
    if (exists) {
      return;
    }

    const slug = uniqueSlug(usedProductSlugs, sample.name);
    usedProductSlugs.add(slug);
    const categoryId = categoryByKey.get(sample.categoryKey) || null;
    const product = sanitizeProduct(
      {
        id: makeId("prd"),
        slug,
        name: sample.name,
        sku: sample.sku,
        brand: sample.brand,
        price: sample.price,
        compareAtPrice: sample.compareAtPrice,
        rating: sample.rating,
        reviewCount: sample.reviewCount,
        stock: sample.stock,
        shortDescription: sample.shortDescription,
        description: sample.description,
        shippingInfo: sample.shippingInfo,
        tags: sample.tags,
        variants: sample.variants,
        features: sample.features,
        badges: sample.badges,
        images: sample.images,
        isPublished: sample.isPublished,
        isFeatured: sample.isFeatured,
        isNewArrival: sample.isNewArrival,
        categoryId,
        createdAt: now,
        updatedAt: now
      },
      new Set(db.categories.map((category) => category.id))
    );
    db.products.unshift(product);
    productsAdded += 1;
  });

  const seedHeroCards = [
    {
      title: "Luxury Drinkware Collection",
      subtitle: "Premium bottles and tumblers designed to stand out in every setting.",
      ctaLabel: "Shop Drinkware",
      ctaHref: "/catalog",
      image: "/images/carousel/slide-1.jpeg"
    },
    {
      title: "Refined Home Decor Staples",
      subtitle: "Bring warmth and elegance to your room with statement essentials.",
      ctaLabel: "Shop Decor",
      ctaHref: "/catalog",
      image: "/images/carousel/slide-2.jpeg"
    },
    {
      title: "Modern Kitchen Essentials",
      subtitle: "High-function kitchen accessories made for daily luxury use.",
      ctaLabel: "Shop Kitchenware",
      ctaHref: "/catalog",
      image: "/images/carousel/slide-3.jpeg"
    }
  ];

  const existingHeroTitles = new Set(db.heroCards.map((card) => normalizeKey(card.title)));
  let heroCardsAdded = 0;
  seedHeroCards.forEach((sample) => {
    if (existingHeroTitles.has(normalizeKey(sample.title))) {
      return;
    }
    const card = sanitizeHeroCard({
      id: makeId("hero"),
      title: sample.title,
      subtitle: sample.subtitle,
      ctaLabel: sample.ctaLabel,
      ctaHref: sample.ctaHref,
      image: sample.image,
      createdAt: now,
      updatedAt: now
    });
    db.heroCards.push(card);
    existingHeroTitles.add(normalizeKey(sample.title));
    heroCardsAdded += 1;
  });

  const seedTestimonials = [
    {
      name: "Saad R.",
      city: "Karachi",
      quote:
        "The product finish feels premium and the packaging looked gift-ready right out of the box."
    },
    {
      name: "Hina M.",
      city: "Islamabad",
      quote: "I ordered twice in one month. Quality stayed consistent and delivery was always on time."
    }
  ];

  const existingQuotes = new Set(db.testimonials.map((item) => normalizeKey(item.quote)));
  let testimonialsAdded = 0;
  seedTestimonials.forEach((sample) => {
    if (existingQuotes.has(normalizeKey(sample.quote))) {
      return;
    }
    const testimonial = sanitizeTestimonial({
      id: makeId("testi"),
      name: sample.name,
      city: sample.city,
      quote: sample.quote,
      createdAt: now,
      updatedAt: now
    });
    db.testimonials.push(testimonial);
    existingQuotes.add(normalizeKey(sample.quote));
    testimonialsAdded += 1;
  });

  await writeDb(db);

  return {
    categoriesAdded,
    productsAdded,
    heroCardsAdded,
    testimonialsAdded
  };
}





