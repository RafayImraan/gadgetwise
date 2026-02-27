import CatalogClient from "@/app/catalog/catalog-client";
import { getCatalogProducts, getPublicCategories } from "@/lib/storefront-db";

export const metadata = {
  title: "Product Catalog",
  description:
    "Browse all products with search, filtering, sorting, and quick view to find the best match for your needs."
};

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }) {
  const [products, categories] = await Promise.all([
    getCatalogProducts(),
    getPublicCategories()
  ]);

  const initialQuery = searchParams?.q || "";
  const initialCategory = searchParams?.category || "";
  const initialSort = searchParams?.sort || "popularity";

  return (
    <main className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Catalog</p>
        <h1>Find Products That Match Your Need</h1>
      </div>
      <CatalogClient
        initialProducts={products}
        categories={categories}
        initialQuery={initialQuery}
        initialCategory={initialCategory}
        initialSort={initialSort}
      />
    </main>
  );
}
