import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminSessionCookie, isAdminAuthenticated, validateAdminPassword } from "@/lib/admin-auth";
import { checkRateLimit, getIpFromHeaders } from "@/lib/rate-limit";
import { createAdminAuditLog } from "@/lib/storefront-db";

export const metadata = {
  title: "Admin Login",
  description: "Secure admin access for catalog and order management."
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  async function loginAction(formData) {
    "use server";
    const ip = getIpFromHeaders(await headers());
    const limiter = checkRateLimit({
      key: `admin-login:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000
    });

    if (!limiter.allowed) {
      redirect("/admin/login?error=rate");
    }

    const password = String(formData.get("password") || "");
    if (!validateAdminPassword(password)) {
      await createAdminAuditLog({
        actor: "admin",
        action: "admin_login_failed",
        scope: "auth",
        meta: { ip }
      });
      redirect("/admin/login?error=1");
    }

    await createAdminSessionCookie();
    await createAdminAuditLog({
      actor: "admin",
      action: "admin_login_success",
      scope: "auth",
      meta: { ip }
    });
    redirect("/admin");
  }

  return (
    <main className="section-block admin-login">
      <section className="panel-card">
        <p className="eyebrow">Admin Panel</p>
        <h1>Sign In</h1>
        <p>Use your admin password from environment configuration.</p>
        <form action={loginAction}>
          <label>
            Admin Password
            <input type="password" name="password" required />
          </label>
          <button type="submit" className="btn">
            Login
          </button>
        </form>
        {searchParams?.error ? (
          <p className="form-error">
            {searchParams.error === "rate"
              ? "Too many attempts. Please wait a few minutes and try again."
              : "Invalid password. Try again."}
          </p>
        ) : null}
      </section>
    </main>
  );
}
