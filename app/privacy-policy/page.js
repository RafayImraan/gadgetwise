export const metadata = {
  title: "Privacy Policy",
  description: "How customer data is collected, processed, and protected."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="section-block legal-page">
      <h1>Privacy Policy</h1>
      <p>
        We collect only the data required to process orders, provide customer support, and improve
        shopping experience. This includes contact details, shipping information, and transaction logs.
      </p>
      <p>
        Analytics and ad tools such as Google Analytics, GTM, Meta Pixel, and TikTok Pixel may be
        used to measure campaign performance and site usage.
      </p>
      <p>
        We do not sell personal data. Information may be shared with payment processors and courier
        partners only for order fulfillment.
      </p>
      <p>
        Customers can request data updates or deletion through customer support. We retain transaction
        records only as required for legal and accounting compliance.
      </p>
    </main>
  );
}

