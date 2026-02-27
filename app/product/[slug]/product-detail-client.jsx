"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/product/product-card";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/utils";

const sampleReviews = [
  {
    id: "review-1",
    author: "Sara M.",
    rating: 5,
    comment: "Excellent quality and same as described. Delivery was fast."
  },
  {
    id: "review-2",
    author: "Hamza A.",
    rating: 4,
    comment: "Great value for price and easy to use."
  },
  {
    id: "review-3",
    author: "Nimra K.",
    rating: 5,
    comment: "Packaging was secure and support team was responsive."
  }
];

export default function ProductDetailClient({ product, relatedProducts }) {
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || "Default");
  const { addToCart, addRecentlyViewed } = useCart();

  useEffect(() => {
    addRecentlyViewed(product.slug);
  }, [addRecentlyViewed, product.slug]);

  return (
    <>
      <section className="product-detail-layout">
        <div>
          <div className="detail-main-image">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className="zoomable-image"
              />
            ) : (
              <div className="media-placeholder">No image yet</div>
            )}
          </div>
          {product.images?.length ? (
            <div className="thumbnail-row">
              {product.images.map((image) => (
                <button
                  key={image}
                  className={selectedImage === image ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image src={image} alt={product.name} fill sizes="80px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-info">
          <p className="eyebrow">{product.sku}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <p className="product-rating">
            {product.rating.toFixed(1)} / 5 ({product.reviewCount} reviews)
          </p>

          <div className="product-price detail">
            <strong>{formatPrice(product.price)}</strong>
            <span>{formatPrice(product.compareAtPrice)}</span>
          </div>

          <div className="field-group">
            <label htmlFor="variant">Available Variants</label>
            <select
              id="variant"
              value={selectedVariant}
              onChange={(event) => setSelectedVariant(event.target.value)}
            >
              {product.variants.map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>

          <div className="inline-actions">
            <button
              className="btn"
              type="button"
              onClick={() => addToCart(product, quantity, selectedVariant)}
            >
              Add to Cart
            </button>
            <Link className="btn secondary" href="/checkout">
              Buy Now
            </Link>
          </div>

          <div className="detail-meta-card">
            <h3>Delivery and Shipping</h3>
            <p>{product.shippingInfo}</p>
            <p>Stock: {product.stock > 0 ? "In Stock" : "Out of Stock"}</p>
          </div>

          <div className="detail-meta-card">
            <h3>Product Highlights</h3>
            <ul>
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-block compact">
        <div className="section-heading split">
          <h2>Customer Reviews</h2>
          <a href="#review-form">Write a review</a>
        </div>
        <div className="review-grid">
          {sampleReviews.map((review) => (
            <article key={review.id}>
              <h3>{review.author}</h3>
              <p>Rating: {review.rating} / 5</p>
              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block compact">
        <div className="section-heading split">
          <h2>Related Products</h2>
          <Link href={`/catalog?category=${product.category?.slug || ""}`}>
            View all in this category
          </Link>
        </div>
        <div className="product-grid">
          {relatedProducts.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </>
  );
}
