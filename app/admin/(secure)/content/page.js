import { revalidatePath } from "next/cache";
import {
  createAdminAuditLog,
  createHeroCard,
  createTestimonial,
  deleteHeroCard,
  deleteTestimonial,
  getHeroCards,
  getTestimonials,
  updateHeroCard,
  updateTestimonial
} from "@/lib/storefront-db";
import { requireAdminAuth } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/admin-media";

export const metadata = {
  title: "Admin Content",
  description: "Manage homepage cards and testimonials."
};

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  requireAdminAuth();

  const [heroCards, testimonials] = await Promise.all([getHeroCards(), getTestimonials()]);

  async function createHeroCardAction(formData) {
    "use server";
    requireAdminAuth();
    const imageUrl = String(formData.get("image") || "").trim();
    const imageFile = formData.get("imageFile");
    const uploaded = await saveUploadedImage(imageFile, "hero");

    await createHeroCard({
      title: String(formData.get("title") || "").trim(),
      subtitle: String(formData.get("subtitle") || "").trim(),
      ctaLabel: String(formData.get("ctaLabel") || "").trim(),
      ctaHref: String(formData.get("ctaHref") || "").trim(),
      image: uploaded || imageUrl
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "hero_card_created",
      scope: "content",
      meta: { title: String(formData.get("title") || "").trim() }
    });

    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  async function updateHeroCardAction(formData) {
    "use server";
    requireAdminAuth();
    const cardId = String(formData.get("cardId") || "").trim();
    const currentImage = String(formData.get("currentImage") || "").trim();
    const imageUrl = String(formData.get("image") || "").trim();
    const imageFile = formData.get("imageFile");
    const uploaded = await saveUploadedImage(imageFile, "hero");

    if (!cardId) {
      return;
    }

    await updateHeroCard(cardId, {
      title: String(formData.get("title") || "").trim(),
      subtitle: String(formData.get("subtitle") || "").trim(),
      ctaLabel: String(formData.get("ctaLabel") || "").trim(),
      ctaHref: String(formData.get("ctaHref") || "").trim(),
      image: uploaded || imageUrl || currentImage
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "hero_card_updated",
      scope: "content",
      targetId: cardId
    });

    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  async function deleteHeroCardAction(formData) {
    "use server";
    requireAdminAuth();

    const cardId = String(formData.get("cardId") || "").trim();
    if (!cardId) {
      return;
    }

    await deleteHeroCard(cardId);
    await createAdminAuditLog({
      actor: "admin",
      action: "hero_card_deleted",
      scope: "content",
      targetId: cardId
    });
    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  async function createTestimonialAction(formData) {
    "use server";
    requireAdminAuth();

    await createTestimonial({
      name: String(formData.get("name") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      quote: String(formData.get("quote") || "").trim()
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "testimonial_created",
      scope: "content",
      meta: { name: String(formData.get("name") || "").trim() }
    });

    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  async function updateTestimonialAction(formData) {
    "use server";
    requireAdminAuth();
    const testimonialId = String(formData.get("testimonialId") || "").trim();
    if (!testimonialId) {
      return;
    }

    await updateTestimonial(testimonialId, {
      name: String(formData.get("name") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      quote: String(formData.get("quote") || "").trim()
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "testimonial_updated",
      scope: "content",
      targetId: testimonialId
    });

    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  async function deleteTestimonialAction(formData) {
    "use server";
    requireAdminAuth();

    const testimonialId = String(formData.get("testimonialId") || "").trim();
    if (!testimonialId) {
      return;
    }

    await deleteTestimonial(testimonialId);
    await createAdminAuditLog({
      actor: "admin",
      action: "testimonial_deleted",
      scope: "content",
      targetId: testimonialId
    });
    revalidatePath("/admin/content");
    revalidatePath("/");
  }

  return (
    <section className="admin-layout-grid">
      <article className="panel-card">
        <h2>Add Hero Card</h2>
        <form action={createHeroCardAction}>
          <label>
            Title
            <input type="text" name="title" required />
          </label>
          <label>
            Subtitle
            <textarea name="subtitle" rows={3} />
          </label>
          <div className="field-row">
            <label>
              Button Label
              <input type="text" name="ctaLabel" defaultValue="Explore" />
            </label>
            <label>
              Button Link
              <input type="text" name="ctaHref" defaultValue="/catalog" />
            </label>
          </div>
          <label>
            Image URL
            <input type="url" name="image" />
          </label>
          <label>
            Upload Image
            <input type="file" name="imageFile" accept="image/*" />
          </label>
          <button className="btn" type="submit">
            Save Hero Card
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h2>Homepage Hero Cards</h2>
        {!heroCards.length ? <p>No hero cards yet.</p> : null}
        <div className="admin-list">
          {heroCards.map((card) => (
            <div key={card.id} className="admin-list-row">
              <div>
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
                <p>
                  CTA: {card.ctaLabel} ({card.ctaHref})
                </p>
                <p>{card.image}</p>
                <details>
                  <summary>Edit Hero Card</summary>
                  <form action={updateHeroCardAction}>
                    <input type="hidden" name="cardId" value={card.id} />
                    <input type="hidden" name="currentImage" value={card.image || ""} />
                    <label>
                      Title
                      <input type="text" name="title" defaultValue={card.title} required />
                    </label>
                    <label>
                      Subtitle
                      <textarea name="subtitle" rows={3} defaultValue={card.subtitle} />
                    </label>
                    <div className="field-row">
                      <label>
                        Button Label
                        <input type="text" name="ctaLabel" defaultValue={card.ctaLabel} />
                      </label>
                      <label>
                        Button Link
                        <input type="text" name="ctaHref" defaultValue={card.ctaHref} />
                      </label>
                    </div>
                    <label>
                      Image URL
                      <input type="url" name="image" defaultValue={card.image || ""} />
                    </label>
                    <label>
                      Upload Image
                      <input type="file" name="imageFile" accept="image/*" />
                    </label>
                    <button className="btn secondary" type="submit">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
              <form action={deleteHeroCardAction}>
                <input type="hidden" name="cardId" value={card.id} />
                <button className="btn secondary" type="submit">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </article>

      <article className="panel-card">
        <h2>Add Testimonial</h2>
        <form action={createTestimonialAction}>
          <div className="field-row">
            <label>
              Name
              <input type="text" name="name" required />
            </label>
            <label>
              City
              <input type="text" name="city" />
            </label>
          </div>
          <label>
            Quote
            <textarea name="quote" rows={4} required />
          </label>
          <button className="btn" type="submit">
            Save Testimonial
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h2>Homepage Testimonials</h2>
        {!testimonials.length ? <p>No testimonials yet.</p> : null}
        <div className="admin-list">
          {testimonials.map((item) => (
            <div key={item.id} className="admin-list-row">
              <div>
                <h3>{item.name}</h3>
                <p>{item.city}</p>
                <p>{item.quote}</p>
                <details>
                  <summary>Edit Testimonial</summary>
                  <form action={updateTestimonialAction}>
                    <input type="hidden" name="testimonialId" value={item.id} />
                    <div className="field-row">
                      <label>
                        Name
                        <input type="text" name="name" defaultValue={item.name} required />
                      </label>
                      <label>
                        City
                        <input type="text" name="city" defaultValue={item.city || ""} />
                      </label>
                    </div>
                    <label>
                      Quote
                      <textarea name="quote" rows={4} defaultValue={item.quote} required />
                    </label>
                    <button className="btn secondary" type="submit">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
              <form action={deleteTestimonialAction}>
                <input type="hidden" name="testimonialId" value={item.id} />
                <button className="btn secondary" type="submit">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
