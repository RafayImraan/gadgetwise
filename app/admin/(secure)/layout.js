import Link from "next/link";
import { redirect } from "next/navigation";
import { clearAdminSessionCookie, requireAdminAuth } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function AdminSecureLayout({ children }) {
  await requireAdminAuth();

  async function logoutAction() {
    "use server";
    await createAdminAuditLog({
      actor: "admin",
      action: "admin_logout",
      scope: "auth"
    });
    await clearAdminSessionCookie();
    redirect("/admin/login");
  }

  return (
    <main className="section-block admin-shell">
      <header className="panel-card admin-topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Store Control Panel</h1>
        </div>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/audit">Audit</Link>
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="btn secondary">
            Logout
          </button>
        </form>
      </header>
      {children}
    </main>
  );
}

