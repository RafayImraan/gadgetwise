import { siteConfig } from "./site-config";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0
});

export function formatPrice(amount) {
  return currencyFormatter.format(amount || 0);
}

export function getDiscountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) {
    return 0;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function slugToTitle(slug) {
  return (slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toInt(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.floor(number);
}
