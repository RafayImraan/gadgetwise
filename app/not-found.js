import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  description: "The requested page could not be found."
};

export default function NotFound() {
  return (
    <main className="not-found-page section-block">
      <p className="eyebrow">404 Error</p>
      <h1>We could not find that page.</h1>
      <p>The link may have expired or the page may have moved.</p>
      <div className="inline-actions">
        <Link className="btn" href="/">
          Go Home
        </Link>
        <Link className="btn secondary" href="/catalog">
          View Catalog
        </Link>
      </div>
    </main>
  );
}

