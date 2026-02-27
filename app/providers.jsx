"use client";

import { CartProvider } from "@/components/cart/cart-provider";
import CartToast from "@/components/common/cart-toast";
import InitialSplash from "@/components/common/initial-splash";

export default function Providers({ children }) {
  return (
    <CartProvider>
      <InitialSplash />
      {children}
      <CartToast />
    </CartProvider>
  );
}
