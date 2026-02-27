import { notFound } from "next/navigation";
import ProductDetailClient from "@/app/product/[slug]/product-detail-client";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront-db";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product Not Found"
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images?.[0] ? [{ url: product.images[0] }] : []
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product, 4);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount
    },
    offers: {
      "@type": "Offer",
      priceCurrency: siteConfig.currency,
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.domain}/product/${product.slug}`
    }
  };

  return (
    <main className="section-block">
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      <section className="section-block compact">
        <h2>Transparent Shipping Details</h2>
        <p>{product.shippingInfo}</p>
        <p>
          Current price: <strong>{formatPrice(product.price)}</strong>
        </p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
