import Link from "next/link";
import { footerLinks, paymentMethods } from "@/lib/site-data";
import { siteConfig } from "@/lib/site-config";
import { getPublicCategories } from "@/lib/storefront-db";

export default async function SiteFooter() {
  const year = new Date().getFullYear();
  const waHref = `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`;
  const categories = await getPublicCategories(10);

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section>
          <p className="footer-badge">Premium Commerce Suite</p>
          <h3>{siteConfig.name}</h3>
          <p>
            Reliable home essentials for modern living. Built for conversion, performance, and
            long-term customer trust.
          </p>
          <p>Email: {siteConfig.contact.email}</p>
          <p>Phone: {siteConfig.contact.phone}</p>
          <a href={waHref} target="_blank" rel="noreferrer">
            WhatsApp: {siteConfig.contact.whatsapp}
          </a>
        </section>

        <section>
          <h4>Company</h4>
          {footerLinks.company.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </section>

        <section>
          <h4>Policies</h4>
          {footerLinks.policies.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </section>

        <section>
          <h4>Shopping</h4>
          {footerLinks.account.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <h5>Shop by Categories</h5>
          {categories.map((category) => (
            <Link key={category.id} href={`/catalog?category=${category.slug}`}>
              {category.name}
            </Link>
          ))}
          <h5>Payment Methods</h5>
          <p>{paymentMethods.join(" | ")}</p>
        </section>
      </div>

      <div className="footer-bottom">
        <p>
          (c) {year} {siteConfig.name}. All rights reserved.
        </p>
        <p>SSL secured checkout | Core Web Vitals optimized | SEO-ready architecture</p>
      </div>
    </footer>
  );
}
