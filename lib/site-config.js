export const siteConfig = {
  name: "Gadgetwise",
  title: "Gadgetwise - Smart Home, Decor, and Lifestyle Essentials",
  description:
    "Conversion-focused e-commerce storefront for urban Pakistan customers looking for reliable home products, secure payments, and fast delivery.",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://www.gadgetwise.pk",
  locale: "en_PK",
  currency: "PKR",
  targetAudience: {
    segment: "Urban households and young families in Pakistan",
    ageRange: "22-45",
    interests: ["Home organization", "Decor upgrades", "Smart daily-use gadgets"],
    painPoints: ["Low quality products", "Late delivery", "Unclear return policies"]
  },
  contact: {
    email: "support@gadgetwise.pk",
    phone: "+92 300 1112233",
    whatsapp: "+923001112233",
    address: "Shahrah-e-Faisal, Karachi, Pakistan"
  },
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com"
  },
  shipping: {
    freeShippingThreshold: 5000,
    defaultFee: 250
  }
};
