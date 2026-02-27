"use client";

import { useState } from "react";

export default function NewsletterForm({ source = "homepage" }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitForm = async (event) => {
    event.preventDefault();
    if (!consent) {
      setError("Please consent before subscribing.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          source
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to subscribe.");
        return;
      }

      setMessage("Subscribed successfully. Check your inbox for updates.");
      setEmail("");
      setConsent(false);
    } catch (requestError) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="newsletter-form" onSubmit={submitForm}>
      <label htmlFor={`newsletter-${source}`}>Email Address</label>
      <input
        id={`newsletter-${source}`}
        type="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <label className="checkbox-row" htmlFor={`newsletter-consent-${source}`}>
        <input
          id={`newsletter-consent-${source}`}
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        I agree to receive marketing emails and promotional offers.
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Joining..." : "Join Newsletter"}
      </button>
      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}

