"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "nexanest-cart-v1";
const WISHLIST_STORAGE_KEY = "nexanest-wishlist-v1";
const RECENT_STORAGE_KEY = "nexanest-recently-viewed-v1";

const CartContext = createContext(null);

function readStorage(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallbackValue;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Silent fail avoids breaking UX if storage is blocked.
  }
}

function sanitizeStoredCart(cartItems) {
  if (!Array.isArray(cartItems)) {
    return [];
  }

  return cartItems.map((item) => {
    const image = String(item?.image || "").trim();
    return {
      ...item,
      image: image.includes("cdn.shopify.com") ? "" : image
    };
  });
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [toast, setToast] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedCart = sanitizeStoredCart(readStorage(CART_STORAGE_KEY, []));
    const storedWishlist = readStorage(WISHLIST_STORAGE_KEY, []);
    const storedRecent = readStorage(RECENT_STORAGE_KEY, []);

    // Keep SSR/CSR markup stable while still avoiding overwrite if user interacts early.
    setCart((current) => (current.length ? current : storedCart));
    setWishlist((current) => (current.length ? current : storedWishlist));
    setRecentlyViewed((current) => (current.length ? current : storedRecent));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    writeStorage(CART_STORAGE_KEY, cart);
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    writeStorage(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    writeStorage(RECENT_STORAGE_KEY, recentlyViewed);
  }, [recentlyViewed, isHydrated]);

  const addToCart = (product, quantity = 1, variant = "") => {
    if (!product) {
      return;
    }

    const safeQuantity = Number.isFinite(quantity) ? quantity : 1;
    const lineId = `${product.slug}-${variant || "default"}`;

    setCart((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: Math.max(1, item.quantity + safeQuantity) }
            : item
        );
      }

      return [
        ...current,
        {
          lineId,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          price: product.price,
          image: product.images?.[0] || "",
          variant: variant || product.variants?.[0] || "Default",
          quantity: Math.max(1, safeQuantity)
        }
      ];
    });

    setToast({
      id: Date.now(),
      title: "Added to cart",
      message: `${product.name} x${Math.max(1, safeQuantity)}`
    });
  };

  const updateQuantity = (lineId, quantity) => {
    setCart((current) =>
      current
        .map((item) =>
          item.lineId === lineId ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (lineId) => {
    setCart((current) => current.filter((item) => item.lineId !== lineId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (slug) => {
    setWishlist((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  };

  const addRecentlyViewed = (slug) => {
    if (!slug) {
      return;
    }

    setRecentlyViewed((current) => [slug, ...current.filter((item) => item !== slug)].slice(0, 12));
  };

  const clearToast = () => {
    setToast(null);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      isHydrated,
      cart,
      wishlist,
      recentlyViewed,
      subtotal,
      cartCount,
      toast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      addRecentlyViewed,
      clearToast
    }),
    [isHydrated, cart, wishlist, recentlyViewed, subtotal, cartCount, toast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
