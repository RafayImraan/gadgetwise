"use client";

import { useEffect, useMemo, useState } from "react";

export default function TestimonialSlider({ items = [] }) {
  const slides = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  return (
    <div className="testimonial-slider">
      <div className="testimonial-track-wrap">
        <div
          className="testimonial-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((item) => (
            <article key={item.id}>
              <p>"{item.quote}"</p>
              <h3>{item.name}</h3>
              <span>{item.city}</span>
            </article>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="testimonial-slider-dots" aria-hidden="true">
          {slides.map((item, index) => (
            <span key={`dot-${item.id}`} className={index === active ? "active" : ""} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
