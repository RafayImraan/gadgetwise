"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { paymentMethods } from "@/lib/site-data";
import { siteConfig } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

export default function CheckoutClient() {
  const { cart, subtotal, clearCart } = useCart();
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [sameBilling, setSameBilling] = useState(true);
  const [consent, setConsent] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const cartPayload = cart.map((item) => ({
    slug: item.slug,
    quantity: item.quantity,
    variant: item.variant
  }));

  const shippingFee = useMemo(() => {
    if (!cart.length || subtotal >= siteConfig.shipping.freeShippingThreshold) {
      return 0;
    }
    if (deliveryOption === "express") {
      return 450;
    }
    return siteConfig.shipping.defaultFee;
  }, [cart.length, subtotal, deliveryOption]);

  const total = subtotal + shippingFee;

  const initializeOnlinePayment = async () => {
    if (paymentMethod === "Cash on Delivery") {
      return { ok: true, paymentReference: "" };
    }

    if (paymentMethod === "Stripe (Card)") {
      const response = await fetch("/api/payments/stripe/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cartPayload,
          deliveryOption
        })
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result?.error || "Unable to initialize Stripe payment." };
      }
      return { ok: true, paymentReference: result.paymentReference || "" };
    }

    if (paymentMethod === "PayPal") {
      const response = await fetch("/api/payments/paypal/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cartPayload,
          deliveryOption
        })
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result?.error || "Unable to initialize PayPal order." };
      }
      if (result?.approvalUrl) {
        window.open(result.approvalUrl, "_blank", "noopener,noreferrer");
      }
      return { ok: true, paymentReference: result.paymentReference || "" };
    }

    return {
      ok: true,
      paymentReference: `manual-${Date.now()}`
    };
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!consent) {
      setSubmitError("Please accept policy consent before placing the order.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    const paymentInit = await initializeOnlinePayment();
    if (!paymentInit.ok) {
      setSubmitError(paymentInit.error || "Unable to start payment.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer: {
        fullName: String(formData.get("fullName") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        city: String(formData.get("city") || ""),
        shippingAddress: String(formData.get("shippingAddress") || ""),
        billingAddress: sameBilling ? "" : String(formData.get("billingAddress") || "")
      },
      deliveryOption,
      paymentMethod,
      paymentReference: paymentInit.paymentReference || "",
      items: cartPayload
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result?.error || "Unable to place order right now.");
        return;
      }

      setOrderId(result.orderNumber);
      clearCart();
    } catch (error) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <main className="section-block">
        <p className="eyebrow">Order Confirmed</p>
        <h1>Thank you for your purchase.</h1>
        <p>Your order number is {orderId}. A confirmation message will be sent to your email.</p>
        <div className="inline-actions">
          <Link href={`/track-order?order=${orderId}`} className="btn">
            Track Order
          </Link>
          <Link href="/catalog" className="btn secondary">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="section-block">
        <h1>Checkout</h1>
        <p>Your cart is empty. Add products before checkout.</p>
        <Link href="/catalog" className="btn">
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="section-block">
      <div className="section-heading split">
        <h1>Secure Checkout</h1>
        <p>PCI-compliant payment integrations can be connected to this form.</p>
      </div>

      <form className="checkout-layout" onSubmit={onSubmit}>
        <section className="checkout-fields">
          <h2>Shipping Address</h2>
          <div className="field-row">
            <label>
              Full Name
              <input type="text" name="fullName" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Phone
              <input type="tel" name="phone" required />
            </label>
            <label>
              City
              <input type="text" name="city" required />
            </label>
          </div>
          <label>
            Shipping Address
            <input type="text" name="shippingAddress" required />
          </label>

          <h2>Billing Address</h2>
          <label className="checkbox-row">
            <input type="checkbox" checked={sameBilling} onChange={() => setSameBilling((value) => !value)} />
            Billing address is the same as shipping.
          </label>
          {!sameBilling ? (
            <label>
              Billing Address
              <input type="text" name="billingAddress" required />
            </label>
          ) : null}

          <h2>Delivery Options</h2>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="deliveryOption"
                checked={deliveryOption === "standard"}
                onChange={() => setDeliveryOption("standard")}
              />
              Standard (2-5 business days)
            </label>
            <label>
              <input
                type="radio"
                name="deliveryOption"
                checked={deliveryOption === "express"}
                onChange={() => setDeliveryOption("express")}
              />
              Express (1-2 business days)
            </label>
          </div>

          <h2>Payment Method</h2>
          <div className="radio-group">
            {paymentMethods.map((method) => (
              <label key={method}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                {method}
              </label>
            ))}
          </div>

          <div className="secure-badge">
            SSL Secured | PCI-compliant gateway support | Fraud-protection ready
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            I agree to the privacy policy, terms, and legal handling of my order data.
          </label>

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>
          {submitError ? <p className="form-error">{submitError}</p> : null}
        </section>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.lineId}>
                <span>
                  {item.name} x {item.quantity}
                </span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingFee ? formatPrice(shippingFee) : "Free"}</dd>
            </div>
            <div className="total-row">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p>Selected payment: {paymentMethod}</p>
        </aside>
      </form>
    </main>
  );
}

