"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "@/components/product/product-card";

export default function CollectionTabs({
  featured = [],
  newArrivals = [],
  trending = [],
  showAllHref = "/collections",
  showAllLabel = "Show all"
}) {
  const tabs = useMemo(
    () => [
      { id: "featured", label: "Best Sellers", products: featured },
      { id: "new", label: "New Arrivals", products: newArrivals },
      { id: "trending", label: "Trending Now", products: trending }
    ],
    [featured, newArrivals, trending]
  );

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "featured");
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section className="section-block">
      <div className="section-heading split">
        <div>
          <p className="eyebrow">Curated Collections</p>
          <h2>High-Converting Product Mix</h2>
        </div>
        <Link href={showAllHref}>{showAllLabel}</Link>
      </div>

      <div className="collection-tabs" role="tablist" aria-label="Collection tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active?.id === tab.id}
            className={active?.id === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {(active?.products || []).slice(0, 4).map((product) => (
          <ProductCard key={`${active.id}-${product.slug}`} product={product} />
        ))}
      </div>
    </section>
  );
}
