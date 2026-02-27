import Image from "next/image";

export default function Loading() {
  return (
    <main className="app-loading-screen" aria-label="Loading">
      <div className="app-loading-card">
        <div className="app-loading-logo-wrap">
          <Image
            src="/images/logo/brand-logo.jpeg"
            alt="Gadgetwise logo"
            fill
            sizes="84px"
            priority
          />
        </div>
        <h2>Gadgetwise</h2>
        <p>Loading premium storefront...</p>
        <div className="app-loading-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
