import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "About Us",
  description: "Learn about our mission, brand values, team, and quality commitment."
};

export default function AboutPage() {
  return (
    <main className="section-block about-page">
      <div className="section-heading">
        <p className="eyebrow">About {siteConfig.name}</p>
        <h1>Built to Make Everyday Living Better</h1>
      </div>

      <section className="panel-card">
        <h2>Our Story</h2>
        <p>
          {siteConfig.name} started with one goal: provide practical products that improve daily
          routines without compromising on design and quality. We focus on categories that customers
          actually use every day.
        </p>
      </section>

      <section className="three-col">
        <article className="panel-card">
          <h3>Mission</h3>
          <p>Deliver trusted products, fast shipping, and transparent post-sale support.</p>
        </article>
        <article className="panel-card">
          <h3>Vision</h3>
          <p>Become the go-to lifestyle e-commerce brand for urban households in Pakistan.</p>
        </article>
        <article className="panel-card">
          <h3>Values</h3>
          <p>Quality first, customer clarity, secure payments, and long-term service reliability.</p>
        </article>
      </section>

      <section className="panel-card">
        <h2>Team and Operations</h2>
        <p>
          Our team includes sourcing, logistics, customer care, and growth specialists. We work with
          vetted suppliers and courier partners to maintain consistency and delivery performance.
        </p>
      </section>
    </main>
  );
}

