export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Catalog", href: "/catalog" },
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "Track Order", href: "/track-order" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "FAQs", href: "/faq" }
  ],
  policies: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms and Conditions", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" }
  ],
  account: [
    { label: "My Account", href: "/account" },
    { label: "Cart", href: "/cart" },
    { label: "Checkout", href: "/checkout" }
  ]
};

export const valueProps = [
  {
    id: "free-shipping",
    title: "Free Shipping Over Rs. 5,000",
    detail: "Flat nationwide dispatch with real-time courier tracking."
  },
  {
    id: "secure-checkout",
    title: "Secure Checkout",
    detail: "Protected payment flow for cards, wallets, and Cash on Delivery."
  },
  {
    id: "support",
    title: "24/7 Customer Care",
    detail: "WhatsApp and phone support from order placement to delivery."
  },
  {
    id: "exchange",
    title: "7-Day Easy Exchange",
    detail: "Simple replacement process for damaged or incorrect products."
  }
];

export const heroCards = [];

export const testimonials = [
  {
    id: "t1",
    name: "Ayesha K.",
    city: "Lahore",
    quote:
      "Delivery was quick and the quality matched the photos. The checkout process was smooth."
  },
  {
    id: "t2",
    name: "Usman R.",
    city: "Karachi",
    quote: "Support team responded on WhatsApp in minutes and helped me track my parcel."
  },
  {
    id: "t3",
    name: "Maham S.",
    city: "Islamabad",
    quote: "Great pricing and clear product details. I reordered after my first purchase."
  }
];

export const paymentMethods = [
  "Cash on Delivery",
  "Stripe (Card)",
  "PayPal",
  "EasyPaisa",
  "JazzCash"
];

export const shippingZones = [
  {
    name: "Pakistan - Metro Cities",
    estimate: "2-4 business days",
    feeRule: "Free above Rs. 5,000, else Rs. 250"
  },
  {
    name: "Pakistan - Non Metro",
    estimate: "3-6 business days",
    feeRule: "Free above Rs. 5,000, else Rs. 350"
  },
  {
    name: "International",
    estimate: "5-12 business days",
    feeRule: "Calculated by weight and destination"
  }
];

export const faqItems = [
  {
    question: "How can I track my order?",
    answer:
      "Go to the Track Order page, enter your order number and phone number, and you will see current shipment status."
  },
  {
    question: "Do you offer Cash on Delivery?",
    answer: "Yes. Cash on Delivery is available for eligible orders across Pakistan."
  },
  {
    question: "How do returns and exchanges work?",
    answer:
      "You can request an exchange within 7 days for damaged, defective, or incorrect items through support."
  },
  {
    question: "Which payment methods do you accept?",
    answer: "We accept Stripe cards, PayPal, EasyPaisa, JazzCash, and Cash on Delivery."
  }
];
