import { siteConfig } from "@/lib/site-config";
import { getSitemapProductEntries } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const staticPages = [
    "",
    "/catalog",
    "/cart",
    "/checkout",
    "/account",
    "/about",
    "/contact",
    "/track-order",
    "/faq",
    "/privacy-policy",
    "/terms",
    "/refund-policy"
  ];

  const staticEntries = staticPages.map((path) => ({
    url: `${siteConfig.domain}${path}`,
    lastModified: new Date()
  }));

  let productEntries = [];
  try {
    const products = await getSitemapProductEntries();

    productEntries = products.map((product) => ({
      url: `${siteConfig.domain}/product/${product.slug}`,
      lastModified: product.updatedAt
    }));
  } catch (error) {
    productEntries = [];
  }

  return [...staticEntries, ...productEntries];
}
