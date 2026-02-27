export const metadata = {
  title: "Terms and Conditions",
  description: "Terms governing use of the website, orders, and customer obligations."
};

export default function TermsPage() {
  return (
    <main className="section-block legal-page">
      <h1>Terms and Conditions</h1>
      <p>
        By using this website, you agree to provide accurate order information and to comply with all
        applicable local laws and regulations.
      </p>
      <p>
        Product availability, prices, offers, and shipping estimates may change without notice. Orders
        may be canceled in cases of payment failure, stock unavailability, or suspected fraud.
      </p>
      <p>
        All trademarks, content, and product media are the property of the brand and may not be
        reused without permission.
      </p>
      <p>
        For disputes or legal concerns, customers may contact support and resolve issues through the
        documented complaint process.
      </p>
    </main>
  );
}

