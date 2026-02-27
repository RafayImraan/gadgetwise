import Image from "next/image";
import Link from "next/link";
import { getPublicCategories } from "@/lib/storefront-db";

export const metadata = {
  title: "All Categories",
  description: "Browse all product categories in one premium collection directory."
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getPublicCategories();

  return (
    <main>
      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Category Directory</p>
            <h1>All Categories</h1>
          </div>
          <Link href="/catalog">Open catalog</Link>
        </div>
        <div className="category-grid">
          {!categories.length ? (
            <article className="panel-card">
              <h3>No categories found.</h3>
              <p>Create categories from admin to populate this page.</p>
            </article>
          ) : null}
          {categories.map((category) => (
            <Link key={category.id} href={`/catalog?category=${category.slug}`} className="category-item">
              <div className="category-image-wrap">
                {category.image ? (
                  <Image src={category.image} alt={category.name} fill sizes="(max-width: 768px) 95vw, 18vw" />
                ) : (
                  <div className="media-placeholder">No image yet</div>
                )}
              </div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
