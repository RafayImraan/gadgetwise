import CheckoutClient from "@/app/checkout/checkout-client";

export const metadata = {
  title: "Checkout",
  description:
    "Secure checkout with shipping and billing details, delivery options, and multiple payment methods."
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}

