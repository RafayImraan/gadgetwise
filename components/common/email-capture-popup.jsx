"use client";

import { useEffect, useState } from "react";

const POPUP_KEY = "nexanest-email-popup-seen";

export default function EmailCapturePopup() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.localStorage.getItem(POPUP_KEY)) {
      return;
    }
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const closePopup = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(POPUP_KEY, "true");
    }
    setOpen(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!consent) {
      setError("Please accept marketing consent.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          source: "popup"
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to subscribe right now.");
        return;
      }

      setSubmitted(true);
    } catch (requestError) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="email-popup-overlay" role="dialog" aria-modal="true" aria-label="Email capture popup">
      <article className="email-popup">
        <button type="button" className="email-popup-close" onClick={closePopup} aria-label="Close popup">
          Close
        </button>
        <p className="eyebrow">Welcome Offer</p>
        <h2>Get 10% Off Your First Order</h2>
        <p>Subscribe for launch offers, restock alerts, and exclusive bundles.</p>
        {!submitted ? (
          <form onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              I agree to receive promotional emails.
            </label>
            <button type="submit" className="btn block" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Get Discount Code"}
            </button>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        ) : (
          <div>
            <p className="form-success">Thanks. Your coupon code is WELCOME10.</p>
            <button type="button" className="btn block" onClick={closePopup}>
              Continue Shopping
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
