"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function LuxuryCarousel({
  slideItems = [],
  slides = [],
  title = "Luxury Essentials",
  subtitle = "Curated premium picks for elevated living.",
  ctaLabel = "Shop Now",
  ctaHref = "/catalog"
}) {
  const safeSlides = useMemo(() => {
    if (Array.isArray(slideItems) && slideItems.length) {
      return slideItems
        .filter((item) => item?.image)
        .map((item, index) => ({
          image: String(item.image),
          title: String(item.title || "Luxury Essentials"),
          subtitle: String(item.subtitle || "Curated premium picks for elevated living."),
          ctaLabel: String(item.ctaLabel || "Shop Now"),
          ctaHref: String(item.ctaHref || "/catalog"),
          kicker: String(item.kicker || "Private Collection"),
          badge: String(item.badge || "Signature Drop"),
          stat: String(item.stat || `${String(index + 1).padStart(2, "0")} Curated`)
        }));
    }

    return slides.filter(Boolean).map((src, index) => ({
      image: String(src),
      title,
      subtitle,
      ctaLabel,
      ctaHref,
      kicker: "Private Collection",
      badge: "Signature Drop",
      stat: `${String(index + 1).padStart(2, "0")} Curated`
    }));
  }, [slideItems, slides, title, subtitle, ctaLabel, ctaHref]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const intervalMs = 6200;

  useEffect(() => {
    setActiveIndex(0);
    setTick(0);
  }, [safeSlides.length]);

  useEffect(() => {
    if (safeSlides.length < 2) {
      return;
    }

    const intervalId = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeSlides.length);
      setTick((current) => current + 1);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [safeSlides.length]);

  const currentSlide =
    safeSlides[activeIndex] || {
      image: "",
      title,
      subtitle,
      ctaLabel,
      ctaHref,
      kicker: "Private Collection",
      badge: "Signature Drop",
      stat: "Curated Luxury"
    };

  return (
    <section className="luxury-carousel-shell section-block" aria-label="Featured luxury carousel">
      <article className="luxury-carousel">
        <div className="luxury-carousel-media">
          {!safeSlides.length ? (
            <div className="media-placeholder">Add images in /images/carousel</div>
          ) : (
            safeSlides.map((slide, index) => (
              <div
                key={`${slide.image}-${index}`}
                className={`luxury-carousel-slide ${index === activeIndex ? "active" : ""}`}
                aria-hidden={index !== activeIndex}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  quality={100}
                  unoptimized
                  sizes="100vw"
                />
              </div>
            ))
          )}

          <div className="luxury-carousel-overlay" />
          <div className="luxury-carousel-noise" />
        </div>

        <div className="luxury-carousel-content-panel">
          <div className="luxury-carousel-content" key={`content-${activeIndex}`}>
          <p className="luxury-carousel-kicker">{currentSlide.kicker}</p>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.subtitle}</p>
          <div className="luxury-carousel-chip-row">
            <span>{currentSlide.badge}</span>
            <span>{currentSlide.stat}</span>
          </div>
          <div className="luxury-carousel-meta">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} / {String(safeSlides.length || 1).padStart(2, "0")}
            </span>
            <span>Enterprise Luxury</span>
          </div>
          <div className="inline-actions">
            <Link href={currentSlide.ctaHref} className="btn luxury-cta">
              {currentSlide.ctaLabel}
            </Link>
          </div>
        </div>
        </div>

        {safeSlides.length > 1 ? (
          <div className="luxury-carousel-progress-segments" aria-hidden="true">
            {safeSlides.map((slide, index) => (
              <span key={`seg-${slide.image}-${index}`} className="segment">
                <span
                  key={index === activeIndex ? `fill-${index}-${tick}` : `idle-${index}`}
                  className={`fill ${index === activeIndex ? "active" : ""}`}
                  style={{ animationDuration: `${intervalMs}ms` }}
                />
              </span>
            ))}
          </div>
        ) : null}

        {safeSlides.length > 1 ? (
          <div className="luxury-carousel-dots" aria-hidden="true">
            {safeSlides.map((slide, index) => (
              <span
                key={`dot-${slide.image}-${index}`}
                className={index === activeIndex ? "active" : ""}
              />
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}


