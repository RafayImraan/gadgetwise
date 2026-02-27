"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function InitialSplash() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => setExiting(true), 3000);
    const hideTimer = setTimeout(() => setVisible(false), 3460);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`initial-splash ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading website"
    >
      <div className="initial-splash-ring-wrap">
        <span className="initial-splash-ring-track" />
        <span className="initial-splash-ring-progress" />
        <div className="initial-splash-logo">
          <Image src="/images/logo/brand-logo.jpeg" alt="Gadgetwise" fill sizes="96px" priority />
        </div>
      </div>
      <p>Loading Gadgetwise...</p>
    </div>
  );
}
