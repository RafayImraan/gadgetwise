import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/product/product-card";
import ValueProps from "@/components/common/value-props";
import NewsletterForm from "@/components/common/newsletter-form";
import LuxuryCarousel from "@/components/common/luxury-carousel";
import CollectionTabs from "@/components/home/collection-tabs";
import ProductRail from "@/components/home/product-rail";
import CategoryOrbit from "@/components/home/category-orbit";
import TestimonialSlider from "@/components/home/testimonial-slider";
import { siteConfig } from "@/lib/site-config";
import {
  getCatalogProducts,
  getHeroCards,
  getNewArrivalProducts,
  getPublicCategories,
  getTestimonials,
  getFeaturedProducts,
} from "@/lib/storefront-db";

export const metadata = {
  title: "Home",
  description:
    "Shop premium home decor, smart gadgets, kitchen tools, and lifestyle essentials with secure checkout and fast shipping."
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, featuredProducts, newArrivals, allProducts, heroCards, testimonials] = await Promise.all([
    getPublicCategories(24),
    getFeaturedProducts(8),
    getNewArrivalProducts(8),
    getCatalogProducts(),
    getHeroCards(),
    getTestimonials()
  ]);

  const carouselSlides = [
    "/images/carousel/slide-1.jpeg",
    "/images/carousel/slide-2.jpeg",
    "/images/carousel/slide-3.jpeg"
  ];
  const fallbackSlides = [
    {
      title: "Gadgetwise Luxury Collection",
      subtitle: "Premium home and lifestyle essentials curated for modern Pakistan.",
      ctaLabel: "Shop Now",
      ctaHref: "/catalog",
      kicker: "Gadgetwise Signature",
      badge: "Premium Essentials",
      stat: "Fast Nationwide Delivery"
    },
    {
      title: "Designed for Everyday Luxury",
      subtitle: "Trusted quality, secure checkout, and smooth shopping from discovery to delivery.",
      ctaLabel: "Explore Collection",
      ctaHref: "/catalog",
      kicker: "Curated Storefront",
      badge: "Secure Checkout",
      stat: "Trusted by Growing Customers"
    },
    {
      title: "Premium Shopping Experience",
      subtitle: "Admin-managed catalog with elegant design, fast support, and delivery confidence.",
      ctaLabel: "Browse Catalog",
      ctaHref: "/catalog",
      kicker: "Customer First",
      badge: "COD + Online Payments",
      stat: "Delivery Across Pakistan"
    }
  ];
  const slideItems = carouselSlides.map((image, index) => {
    const fromAdmin = heroCards[index] || heroCards[0] || null;
    const fallback = fallbackSlides[index] || fallbackSlides[0];
    return {
      image: fromAdmin?.image || image,
      title: fromAdmin?.title || fallback.title,
      subtitle: fromAdmin?.subtitle || fallback.subtitle,
      ctaLabel: fromAdmin?.ctaLabel || fallback.ctaLabel,
      ctaHref: fromAdmin?.ctaHref || fallback.ctaHref,
      kicker: fallback.kicker,
      badge: fallback.badge,
      stat: fallback.stat
    };
  });
  const trendingProducts = [...allProducts]
    .sort(
      (a, b) =>
        b.reviewCount + Math.round(b.rating * 100) - (a.reviewCount + Math.round(a.rating * 100))
    )
    .slice(0, 8);
  const featuredCategories = categories.slice(0, 6);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.domain,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.domain}/catalog?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <main>
      <LuxuryCarousel
        slideItems={slideItems}
      />

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Featured Categories</p>
            <h2>Explore by Product Type</h2>
          </div>
          <Link href="/categories">Show all</Link>
        </div>
        <div className="category-grid">
          {!categories.length ? (
            <article className="panel-card">
              <h3>No categories yet.</h3>
              <p>Create categories from the admin panel to publish your catalog structure.</p>
              <Link href="/admin/categories">Go to admin categories</Link>
            </article>
          ) : null}
          {featuredCategories.map((category) => (
            <Link key={category.id} href={`/catalog?category=${category.slug}`} className="category-item">
              <div className="category-image-wrap">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 95vw, 18vw"
                  />
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

      <CategoryOrbit categories={categories} />

      <CollectionTabs
        featured={featuredProducts}
        newArrivals={newArrivals}
        trending={trendingProducts}
        showAllHref="/collections"
        showAllLabel="Show all"
      />

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Best Sellers</p>
            <h2>Top Performing Products</h2>
          </div>
          <Link href="/best-sellers">Show all</Link>
        </div>
        <div className="product-grid">
          {!featuredProducts.length ? (
            <article className="panel-card">
              <h3>No featured products yet.</h3>
              <p>Add products in admin and mark them as featured to show them here.</p>
              <Link href="/admin/products">Go to admin products</Link>
            </article>
          ) : null}
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="section-block signature-band">
        <article>
          <p className="eyebrow">Signature Service</p>
          <h2>Enterprise-Grade Buying Experience</h2>
          <p>
            From curated catalog strategy to secure checkout and real-time order updates, every
            touchpoint is optimized for premium trust and repeat conversion.
          </p>
          <Link href="/catalog" className="btn secondary">
            Explore Collection
          </Link>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">New Arrivals</p>
            <h2>Fresh Picks for This Month</h2>
          </div>
          <Link href="/catalog?sort=newest">Browse new</Link>
        </div>
        <div className="product-grid">
          {!newArrivals.length ? (
            <article className="panel-card">
              <h3>No products published yet.</h3>
              <p>Your storefront will populate automatically after products are added.</p>
            </article>
          ) : null}
          {newArrivals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <ProductRail products={allProducts} />

      <section className="section-block enterprise-stats">
        <article>
          <h3>3,500+</h3>
          <p>Orders fulfilled with verified delivery updates</p>
        </article>
        <article>
          <h3>99.2%</h3>
          <p>Successful checkout completion and payment reliability</p>
        </article>
        <article>
          <h3>24/7</h3>
          <p>Customer support coverage with real-time order assistance</p>
        </article>
        <article>
          <h3>Secure</h3>
          <p>Protected checkout layers across COD and digital methods</p>
        </article>
      </section>

      <section className="section-block brand-strip">
        <p>Featured in premium campaigns:</p>
        <div>
          <span>Elite Living</span>
          <span>Urban Select</span>
          <span>Modern Home Journal</span>
          <span>Luxe Daily</span>
          <span>Commerce Insider</span>
        </div>
      </section>

      <ValueProps />

      <section className="section-block testimonial-wrap">
        <div className="section-heading">
          <p className="eyebrow">Social Proof</p>
          <h2>What Customers Are Saying</h2>
        </div>
        <TestimonialSlider items={testimonials} />
      </section>

      <section className="section-block growth-band">
        <div>
          <p className="eyebrow">Marketing Ready</p>
          <h2>Capture Emails and Retarget Buyers</h2>
          <p>
            Connect this section to Klaviyo or Mailchimp. Your analytics and pixel hooks are already
            scaffolded through environment variables.
          </p>
        </div>
        <NewsletterForm source="homepage" />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </main>
  );
}

