import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function ProductRail({ products = [] }) {
  return (
    <section className="section-block">
      <div className="section-heading split">
        <div>
          <p className="eyebrow">Editor's Selection</p>
          <h2>Luxury Product Rail</h2>
        </div>
      </div>
      <div className="product-rail" aria-label="Horizontal product rail">
        {products.slice(0, 10).map((product) => (
          <article key={`rail-${product.slug}`} className="product-rail-card">
            <Link href={`/product/${product.slug}`}>
              <div className="product-rail-media">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill sizes="240px" />
                ) : (
                  <div className="media-placeholder">No image</div>
                )}
              </div>
              <div className="product-rail-meta">
                <h3>{product.name}</h3>
                <p>{formatPrice(product.price)}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
