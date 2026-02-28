import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/admin-auth";
import { createAdminAuditLog, getDashboardCounts, seedDemoStoreContent } from "@/lib/storefront-db";
import { getPaymentReadiness } from "@/lib/payment-readiness";

export const metadata = {
  title: "Admin Dashboard",
  description: "Monitor store inventory, orders, and customer interactions."
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminAuth();

  const counts = await getDashboardCounts();
  const paymentReadiness = getPaymentReadiness();

  async function seedDemoContentAction() {
    "use server";
    await requireAdminAuth();
    const result = await seedDemoStoreContent();
    await createAdminAuditLog({
      actor: "admin",
      action: "seed_demo_content",
      scope: "content",
      meta: result || {}
    });

    revalidatePath("/admin");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/admin/content");
    revalidatePath("/");
    revalidatePath("/catalog");
  }

  return (
    <section className="admin-grid">
      <article className="panel-card">
        <h2>Categories</h2>
        <p>{counts.categories}</p>
        <Link href="/admin/categories">Manage categories</Link>
      </article>
      <article className="panel-card">
        <h2>Products</h2>
        <p>{counts.products}</p>
        <Link href="/admin/products">Manage products</Link>
      </article>
      <article className="panel-card">
        <h2>Orders</h2>
        <p>{counts.orders}</p>
        <Link href="/admin/orders">Manage orders</Link>
      </article>
      <article className="panel-card">
        <h2>Homepage Content</h2>
        <p>Cards and testimonials</p>
        <Link href="/admin/content">Manage content</Link>
      </article>
      <article className="panel-card">
        <h2>Contact Messages</h2>
        <p>{counts.contactMessages}</p>
      </article>
      <article className="panel-card">
        <h2>Newsletter Leads</h2>
        <p>{counts.newsletterSubscribers}</p>
      </article>
      <article className="panel-card">
        <h2>Quick Fill</h2>
        <p>Add 2-3 demo items for categories, products, hero cards, and testimonials.</p>
        <form action={seedDemoContentAction}>
          <button type="submit" className="btn">
            Add Demo Content
          </button>
        </form>
      </article>
      <article className="panel-card">
        <h2>Launch Readiness</h2>
        <p>Payment gateway configuration status:</p>
        <p>
          Stripe: {paymentReadiness.stripe.configured ? "Configured" : "Missing"} |{" "}
          {paymentReadiness.stripe.liveSafe ? "Env Safe" : "Fix Env"}
        </p>
        <p>Stripe Notes: {paymentReadiness.stripe.notes}</p>
        <p>
          PayPal: {paymentReadiness.paypal.configured ? "Configured" : "Missing"} | Env:{" "}
          {paymentReadiness.paypal.env} |{" "}
          {paymentReadiness.paypal.liveSafe && paymentReadiness.paypal.envValid
            ? "Env Safe"
            : "Fix Env"}
        </p>
        <p>PayPal Notes: {paymentReadiness.paypal.notes}</p>
        <p>EasyPaisa: {paymentReadiness.easypaisa.configured ? "Configured" : "Missing"}</p>
        <p>JazzCash: {paymentReadiness.jazzcash.configured ? "Configured" : "Missing"}</p>
      </article>
    </section>
  );
}

