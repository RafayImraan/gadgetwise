"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const waHref = `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`;

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSubmitted(false);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: String(formData.get("message") || ""),
      company: String(formData.get("company") || "")
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to submit message.");
        return;
      }

      setSubmitted(true);
      event.currentTarget.reset();
    } catch (requestError) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Customer Care</p>
        <h1>Contact Us</h1>
      </div>

      <div className="two-col-grid contact-grid">
        <form className="panel-card contact-form" onSubmit={onSubmit}>
          <h2>Send Message</h2>
          <label>
            Name
            <input type="text" name="name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Phone
            <input type="tel" name="phone" />
          </label>
          <label>
            Message
            <textarea name="message" rows={6} required />
          </label>
          <input type="text" name="company" className="honeypot" tabIndex={-1} autoComplete="off" />
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          {submitted ? <p className="form-success">Your message was submitted successfully.</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>

        <div className="panel-card">
          <h2>Support Channels</h2>
          <p>Email: {siteConfig.contact.email}</p>
          <p>Phone: {siteConfig.contact.phone}</p>
          <p>Address: {siteConfig.contact.address}</p>
          <a href={waHref} target="_blank" rel="noreferrer">
            Open WhatsApp Chat
          </a>
          <div className="map-wrap">
            <iframe
              title="Gadgetwise Office Map"
              src="https://www.google.com/maps?q=Shahrah-e-Faisal%20Karachi&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
