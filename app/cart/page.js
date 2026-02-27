import CartClient from "@/app/cart/cart-client";

export const metadata = {
  title: "Cart",
  description: "Review selected products, update quantities, and proceed to secure checkout."
};

export default function CartPage() {
  return <CartClient />;
}

