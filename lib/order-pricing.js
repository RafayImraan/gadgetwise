import { getPublishedProductsBySlugs } from "@/lib/storefront-db";
import { siteConfig } from "@/lib/site-config";

function pickShippingFee(subtotal, deliveryOption) {
  if (subtotal >= siteConfig.shipping.freeShippingThreshold) {
    return 0;
  }
  if (deliveryOption === "express") {
    return 450;
  }
  return siteConfig.shipping.defaultFee;
}

export async function buildOrderQuote(items, deliveryOption = "standard") {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return { ok: false, error: "Cart is empty.", items: [], subtotal: 0, shippingFee: 0, total: 0 };
  }

  const slugs = list.map((item) => String(item?.slug || "").trim()).filter(Boolean);
  const dbProducts = await getPublishedProductsBySlugs(slugs);
  if (!dbProducts.length) {
    return {
      ok: false,
      error: "Products are not available.",
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0
    };
  }

  const productBySlug = new Map(dbProducts.map((product) => [product.slug, product]));
  const orderItems = [];

  for (const item of list) {
    const dbProduct = productBySlug.get(String(item?.slug || ""));
    if (!dbProduct) {
      continue;
    }

    const quantity = Math.max(1, Math.min(20, Number(item?.quantity) || 1));
    if (dbProduct.stock <= 0 || quantity > dbProduct.stock) {
      return {
        ok: false,
        error: `${dbProduct.name} is out of stock for requested quantity.`,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0
      };
    }

    const unitPrice = dbProduct.price;
    orderItems.push({
      productId: dbProduct.id,
      productSlug: dbProduct.slug,
      productSku: dbProduct.sku,
      productName: dbProduct.name,
      variant: item?.variant || null,
      quantity,
      unitPrice,
      total: unitPrice * quantity
    });
  }

  if (!orderItems.length) {
    return {
      ok: false,
      error: "No valid products found in cart.",
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0
    };
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = pickShippingFee(subtotal, deliveryOption);
  const total = subtotal + shippingFee;

  return {
    ok: true,
    error: "",
    items: orderItems,
    subtotal,
    shippingFee,
    total
  };
}
