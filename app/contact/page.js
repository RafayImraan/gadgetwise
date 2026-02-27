import ContactClient from "@/app/contact/contact-client";

export const metadata = {
  title: "Contact Us",
  description:
    "Reach customer support through contact form, phone, or WhatsApp. Includes map and business details."
};

export default function ContactPage() {
  return <ContactClient />;
}

