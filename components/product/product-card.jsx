"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice, getDiscountPercent } from "@/lib/utils";

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const discountPercent = getDiscountPercent(product.price, product.compareAtPrice);
  const isWishlisted = wishlist.includes(product.slug);
  const primaryImage = product.images?.[0] || "";

  return (
    <article className="product-card">
      <div className="product-media">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 700px) 90vw, (max-width: 1200px) 40vw, 20vw"
            />
          ) : (
            <div className="media-placeholder">No image yet</div>
          )}
        </Link>
        {discountPercent ? <span className="sale-badge">-{discountPercent}%</span> : null}
        <button
          className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label="Add to wishlist"
        >
          Save
        </button>
      </div>

      <div className="product-meta">
        <p className="product-sku">{product.sku}</p>
        {product.brand ? <p className="product-brand">{product.brand}</p> : null}
        <h3>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="product-rating">
          {product.rating.toFixed(1)} / 5 ({product.reviewCount})
        </p>
        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.compareAtPrice ? <span>{formatPrice(product.compareAtPrice)}</span> : null}
        </div>
      </div>

      <div className="product-actions">
        <button type="button" onClick={() => addToCart(product, 1, product.variants?.[0])}>
          Add to Cart
        </button>
        {typeof onQuickView === "function" ? (
          <button type="button" className="secondary" onClick={() => onQuickView(product)}>
            Quick View
          </button>
        ) : null}
      </div>
    </article>
  );
}
