"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "nexanest-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const existing = window.localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONSENT_KEY, value);
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <aside className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use cookies for analytics, ad measurement, and cart performance. By continuing, you agree
        to our data policy.
      </p>
      <div>
        <button type="button" onClick={() => saveConsent("accepted")}>
          Accept
        </button>
        <button type="button" className="secondary" onClick={() => saveConsent("essential-only")}>
          Essential Only
        </button>
      </div>
    </aside>
  );
}

