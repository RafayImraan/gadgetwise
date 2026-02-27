"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/product-card";
import { formatPrice } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rating" }
];

function applySort(items, sort) {
  switch (sort) {
    case "price-low-high":
      return [...items].sort((a, b) => a.price - b.price);
    case "price-high-low":
      return [...items].sort((a, b) => b.price - a.price);
    case "newest":
      return [...items].sort(
        (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
      );
    case "rating":
      return [...items].sort((a, b) => b.rating - a.rating);
    case "popularity":
    default:
      return [...items].sort((a, b) => b.reviewCount - a.reviewCount);
  }
}

export default function CatalogClient({
  initialProducts,
  categories,
  initialQuery,
  initialCategory,
  initialSort
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [sort, setSort] = useState(initialSort || "popularity");
  const [brand, setBrand] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [quickView, setQuickView] = useState(null);

  const brands = useMemo(() => {
    const unique = new Set(initialProducts.map((item) => item.brand));
    return [...unique];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = initialProducts.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery) ||
        product.tags.join(" ").toLowerCase().includes(normalizedQuery);

      const productCategorySlug = product.category?.slug || "";
      const matchesCategory = !category || productCategorySlug === category;
      const matchesBrand = !brand || product.brand === brand;
      const matchesRating = product.rating >= minRating;
      const matchesPrice = product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesBrand && matchesRating && matchesPrice;
    });

    return applySort(result, sort);
  }, [initialProducts, query, category, brand, minRating, maxPrice, sort]);

  return (
    <>
      <section className="catalog-controls">
        <div className="control-group">
          <label htmlFor="catalog-search">Search</label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            placeholder="Product name, SKU, or keyword"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="catalog-category">Category</label>
          <select
            id="catalog-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="catalog-brand">Brand</label>
          <select id="catalog-brand" value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value="">All Brands</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="catalog-rating">Min Rating</label>
          <select
            id="catalog-rating"
            value={minRating}
            onChange={(event) => setMinRating(Number(event.target.value))}
          >
            <option value={0}>All Ratings</option>
            <option value={3}>3.0+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="catalog-price">Max Price: {formatPrice(maxPrice)}</label>
          <input
            id="catalog-price"
            type="range"
            min={1000}
            max={10000}
            step={100}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="catalog-sort">Sort</label>
          <select id="catalog-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="catalog-summary">
        <p>
          Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}.
        </p>
      </div>

      {!filteredProducts.length ? (
        <article className="catalog-empty-banner" role="status">
          <h3>No results found for "{query.trim() || "your filters"}"</h3>
          <p>Try different keywords, clear some filters, or browse top products below.</p>
        </article>
      ) : null}

      <section className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} onQuickView={setQuickView} />
        ))}
      </section>

      {quickView ? (
        <div className="quick-view-overlay" role="dialog" aria-modal="true" aria-label="Quick view">
          <article className="quick-view-card">
            <button type="button" className="quick-view-close" onClick={() => setQuickView(null)}>
              Close
            </button>
            <div className="quick-view-layout">
              <div className="quick-view-media">
                {quickView.images?.[0] ? (
                  <Image
                    src={quickView.images[0]}
                    alt={quickView.name}
                    fill
                    sizes="(max-width: 900px) 95vw, 45vw"
                  />
                ) : (
                  <div className="media-placeholder">No image yet</div>
                )}
              </div>
              <div>
                <p className="eyebrow">{quickView.sku}</p>
                <h2>{quickView.name}</h2>
                <p>{quickView.shortDescription}</p>
                <p className="quick-price">
                  <strong>{formatPrice(quickView.price)}</strong>{" "}
                  <span>{formatPrice(quickView.compareAtPrice)}</span>
                </p>
                <p>Rating: {quickView.rating.toFixed(1)} / 5</p>
                <div className="inline-actions">
                  <Link href={`/product/${quickView.slug}`} className="btn">
                    View Details
                  </Link>
                  <button type="button" className="btn secondary" onClick={() => setQuickView(null)}>
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
