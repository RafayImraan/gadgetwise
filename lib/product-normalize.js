function safeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  const images = safeArray(product.images);

  return {
    ...product,
    tags: safeArray(product.tags),
    variants: safeArray(product.variants),
    features: safeArray(product.features),
    badges: safeArray(product.badges),
    images
  };
}

export function normalizeProducts(products) {
  return (products || []).map((product) => normalizeProduct(product)).filter(Boolean);
}

export function parseCommaList(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeList(value) {
  const list = safeArray(value);
  return JSON.stringify(list);
}
