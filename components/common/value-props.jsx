import { valueProps } from "@/lib/site-data";

const valueIcons = {
  "free-shipping": "FS",
  "secure-checkout": "SC",
  support: "CC",
  exchange: "EX"
};

export default function ValueProps() {
  return (
    <section className="value-strip" aria-label="Store value propositions">
      {valueProps.map((item) => (
        <article key={item.id} className="value-item">
          <span className="value-item-icon" aria-hidden="true">
            {valueIcons[item.id] || "VP"}
          </span>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}


