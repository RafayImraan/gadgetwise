import ProductCard from "@/components/product/product-card";
import Link from "next/link";
import {
  getCatalogProducts,
  getFeaturedProducts,
  getNewArrivalProducts
} from "@/lib/storefront-db";

export const metadata = {
  title: "Collections",
  description: "Browse curated product collections including best sellers, new arrivals, and trending."
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const [featuredProducts, newArrivals, allProducts] = await Promise.all([
    getFeaturedProducts(12),
    getNewArrivalProducts(12),
    getCatalogProducts()
  ]);

  const trendingProducts = [...allProducts]
    .sort(
      (a, b) =>
        b.reviewCount + Math.round(b.rating * 100) - (a.reviewCount + Math.round(a.rating * 100))
    )
    .slice(0, 12);

  return (
    <main>
      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Curated Library</p>
            <h1>All Collections</h1>
          </div>
          <Link href="/catalog">Open full catalog</Link>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Collection 01</p>
            <h2>Best Sellers</h2>
          </div>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={`featured-${product.slug}`} product={product} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Collection 02</p>
            <h2>New Arrivals</h2>
          </div>
        </div>
        <div className="product-grid">
          {newArrivals.map((product) => (
            <ProductCard key={`new-${product.slug}`} product={product} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Collection 03</p>
            <h2>Trending Now</h2>
          </div>
        </div>
        <div className="product-grid">
          {trendingProducts.map((product) => (
            <ProductCard key={`trend-${product.slug}`} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
