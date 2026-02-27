"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { siteConfig } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

export default function CartClient() {
  const { cart, subtotal, updateQuantity, removeFromCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  const shippingFee = useMemo(() => {
    if (subtotal >= siteConfig.shipping.freeShippingThreshold) {
      return 0;
    }
    return cart.length ? siteConfig.shipping.defaultFee : 0;
  }, [subtotal, cart.length]);

  const promoDiscount = useMemo(() => {
    return isPromoApplied ? subtotal * 0.1 : 0;
  }, [isPromoApplied, subtotal]);

  const total = subtotal + shippingFee - promoDiscount;

  const applyPromo = (event) => {
    event.preventDefault();
    setIsPromoApplied(promoCode.trim().toUpperCase() === "SAVE10");
  };

  if (!cart.length) {
    return (
      <main className="section-block">
        <h1>Your Cart Is Empty</h1>
        <p>Add products from the catalog to start checkout.</p>
        <Link href="/catalog" className="btn">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="section-block">
      <div className="section-heading split">
        <h1>Shopping Cart</h1>
        <Link href="/catalog">Continue Shopping</Link>
      </div>

      <div className="cart-layout">
        <section className="cart-list">
          {cart.map((item) => (
            <article key={item.lineId} className="cart-item">
              <div className="cart-item-image">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="120px" />
                ) : (
                  <div className="media-placeholder">No image yet</div>
                )}
              </div>
              <div className="cart-item-meta">
                <h2>{item.name}</h2>
                <p>{item.variant}</p>
                <p>{item.sku}</p>
                <p>{formatPrice(item.price)}</p>
              </div>
              <div className="cart-item-controls">
                <label htmlFor={`qty-${item.lineId}`}>Qty</label>
                <input
                  id={`qty-${item.lineId}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.lineId, Number(event.target.value))}
                />
                <button type="button" className="text-btn" onClick={() => removeFromCart(item.lineId)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Order Summary</h2>
          <form onSubmit={applyPromo} className="promo-form">
            <label htmlFor="promo-code">Promo Code</label>
            <input
              id="promo-code"
              type="text"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="Use SAVE10"
            />
            <button type="submit">Apply</button>
          </form>

          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingFee ? formatPrice(shippingFee) : "Free"}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>- {formatPrice(promoDiscount)}</dd>
            </div>
            <div className="total-row">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn block">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}
