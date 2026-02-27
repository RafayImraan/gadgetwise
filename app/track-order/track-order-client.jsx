"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState("");

  const trackingCode = useMemo(() => {
    if (!orderNumber) {
      return "";
    }
    return `TCS-${orderNumber.replace(/[^\dA-Z-]/gi, "").slice(-6).toUpperCase()}`;
  }, [orderNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!orderNumber || !phone) {
      return;
    }

    setIsLoading(true);
    setError("");
    setTrackingData(null);

    try {
      const response = await fetch(
        `/api/orders/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Unable to fetch order status.");
        return;
      }

      setTrackingData(result.order);
    } catch (fetchError) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Order Support</p>
        <h1>Track Your Shipment</h1>
      </div>

      <form className="panel-card tracking-form" onSubmit={handleSubmit}>
        <label>
          Order Number
          <input
            type="text"
            value={orderNumber}
            placeholder="NXO-12345"
            onChange={(event) => setOrderNumber(event.target.value)}
            required
          />
        </label>
        <label>
          Phone Number
          <input
            type="tel"
            value={phone}
            placeholder="+92 300 1234567"
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Checking..." : "Check Status"}
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}

      {trackingData ? (
        <section className="panel-card tracking-result">
          <h2>Order {trackingData.orderNumber}</h2>
          <p>Status: {trackingData.status}</p>
          <p>Payment: {trackingData.paymentMethod} ({trackingData.paymentStatus || "pending"})</p>
          <p>Courier Tracking ID: {trackingData.trackingCode || trackingCode}</p>
          <p>
            Courier: {trackingData.courierName} |{" "}
            <a href={trackingData.courierTrackUrl} target="_blank" rel="noreferrer">
              Open courier portal
            </a>
          </p>
          <p>
            Estimated delivery:{" "}
            {trackingData.estimatedDeliveryAt
              ? new Date(trackingData.estimatedDeliveryAt).toLocaleDateString("en-PK")
              : "Calculating"}
          </p>
          <ul className="timeline">
            {trackingData.timeline.map((step) => (
              <li key={step.label} className={step.done ? "done" : ""}>
                {step.label}
              </li>
            ))}
          </ul>
          {trackingData.statusHistory?.length ? (
            <>
              <h3>Status History</h3>
              <ul className="timeline">
                {trackingData.statusHistory.map((entry, idx) => (
                  <li key={`${entry.status}-${entry.at}-${idx}`} className="done">
                    {entry.status} - {new Date(entry.at).toLocaleString("en-PK")}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p>
            Need help? Message support on WhatsApp or call customer care for live assistance.
          </p>
        </section>
      ) : null}
    </main>
  );
}
