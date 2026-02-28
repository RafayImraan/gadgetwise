"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { navLinks } from "@/lib/site-data";
import { siteConfig } from "@/lib/site-config";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountLabel, setAccountLabel] = useState("Account");

  const nav = useMemo(() => navLinks, []);

  useEffect(() => {
    let isMounted = true;
    const loadAccountLabel = async () => {
      try {
        const res = await fetch("/api/account/me", { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) {
            setAccountLabel("Account");
          }
          return;
        }
        const data = await res.json();
        const name = String(data?.customer?.fullName || "").trim();
        if (!isMounted) {
          return;
        }
        setAccountLabel(name ? name.split(" ")[0] : "Account");
      } catch (error) {
        if (isMounted) {
          setAccountLabel("Account");
        }
      }
    };
    loadAccountLabel();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/catalog");
      return;
    }
    router.push(`/catalog?q=${encodeURIComponent(trimmed)}`);
    setMenuOpen(false);
  };

  return (
    <header className="site-header-wrap">
      <p className="announcement-bar">
        Launch Offer: Free shipping over Rs. 5,000 and same-day dispatch in major cities.
      </p>

      <div className="utility-bar">
        <div className="utility-left">
          <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={siteConfig.socialLinks.facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
          <a href={siteConfig.socialLinks.tiktok} target="_blank" rel="noreferrer">
            TikTok
          </a>
        </div>
        <div className="utility-right">
          <Link href="/track-order">Track Order</Link>
          <Link href="/contact">Customer Care</Link>
          <Link href="/admin/login">Admin</Link>
        </div>
      </div>

      <div className="site-header">
        <button
          className="menu-btn"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          Menu
        </button>

        <Link className="brand-logo" href="/">
          <span className="brand-logo-image-wrap">
            <Image
              src="/images/logo/brand-logo.jpeg"
              alt={`${siteConfig.name} logo`}
              fill
              className="brand-logo-image"
              sizes="46px"
              priority
            />
          </span>
          <span className="brand-logo-text">
            <strong>{siteConfig.name}</strong>
            <span>Premium Storefront</span>
          </span>
        </Link>

        <form className="header-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            value={query}
            placeholder="Search products, category, SKU"
            aria-label="Search products"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="header-actions">
          <a className="contact-link" href={`tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`}>
            {siteConfig.contact.phone}
          </a>
          <Link className="account-link" href="/account">
            {accountLabel}
          </Link>
          <Link href="/cart" className="cart-pill">
            Cart <span>{cartCount}</span>
          </Link>
        </div>
      </div>

      <nav className={`site-nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
        <Link href="/categories" onClick={() => setMenuOpen(false)}>
          Shop by Category
        </Link>
        {nav.map((link) => (
          <Link key={link.href + link.label} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}


