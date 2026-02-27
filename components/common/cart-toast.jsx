"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

export default function CartToast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => {
      clearToast();
    }, 2400);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) {
    return null;
  }

  return (
    <aside className="cart-toast" role="status" aria-live="polite">
      <h4>{toast.title}</h4>
      <p>{toast.message}</p>
    </aside>
  );
}
