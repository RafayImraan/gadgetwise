"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function CategoryOrbit({ categories = [] }) {
  const railRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const scrollByAmount = (direction) => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    rail.scrollBy({
      left: direction * 260,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || categories.length < 2 || paused) {
      return;
    }

    const step = 220;
    const timer = setInterval(() => {
      const maxLeft = rail.scrollWidth - rail.clientWidth;
      if (maxLeft <= 0) {
        return;
      }

      const nextLeft = rail.scrollLeft + step;
      if (nextLeft >= maxLeft - 8) {
        rail.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      rail.scrollBy({ left: step, behavior: "smooth" });
    }, 2800);

    return () => clearInterval(timer);
  }, [categories.length, paused]);

  return (
    <section className="section-block shop-orbit-block">
      <div
        className="shop-orbit-shell"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          type="button"
          className="shop-orbit-arrow left"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll categories left"
        >
          {"<"}
        </button>

        <div className="shop-orbit-rail" ref={railRef}>
          {categories.map((category) => (
            <Link
              key={`orbit-${category.id}`}
              href={`/catalog?category=${category.slug}`}
              className="shop-orbit-item"
            >
              <span className="shop-orbit-image">
                {category.image ? (
                  <Image src={category.image} alt={category.name} fill sizes="84px" />
                ) : (
                  <span className="shop-orbit-placeholder">N/A</span>
                )}
              </span>
              <span className="shop-orbit-label">{category.name}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="shop-orbit-arrow right"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll categories right"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
