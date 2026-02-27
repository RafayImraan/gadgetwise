import { faqItems } from "@/lib/site-data";
import FaqClient from "./faq-client";

export const metadata = {
  title: "FAQs",
  description: "Frequently asked questions about orders, shipping, payments, and returns."
};

export default function FaqPage() {
  return <FaqClient items={faqItems} />;
}


