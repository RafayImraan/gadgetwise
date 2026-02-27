import Link from "next/link";
import ProductCard from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/storefront-db";

export const metadata = {
  title: "Best Sellers",
  description: "Discover the most purchased and top-performing products."
};

export const dynamic = "force-dynamic";

export default async function BestSellersPage() {
  const products = await getFeaturedProducts(24);

  return (
    <main>
      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Top Products</p>
            <h1>Best Sellers</h1>
          </div>
          <Link href="/catalog?sort=popularity">Open in catalog</Link>
        </div>
        <div className="product-grid">
          {!products.length ? (
            <article className="panel-card">
              <h3>No best sellers yet.</h3>
              <p>Mark products as featured from admin to populate this page.</p>
            </article>
          ) : null}
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
