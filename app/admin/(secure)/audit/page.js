import { getAdminAuditLogs } from "@/lib/storefront-db";
import { requireAdminAuth } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin Audit Logs",
  description: "Review admin actions and operational activity."
};

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  requireAdminAuth();
  const logs = await getAdminAuditLogs(200);

  return (
    <section className="panel-card">
      <h2>Audit Logs</h2>
      {!logs.length ? <p>No admin activity recorded yet.</p> : null}
      <div className="admin-list">
        {logs.map((log) => (
          <article key={log.id} className="admin-order-card">
            <h3>{log.action}</h3>
            <p>
              Actor: {log.actor} | Scope: {log.scope}
            </p>
            <p>At: {new Date(log.createdAt).toLocaleString("en-PK")}</p>
            {log.targetId ? <p>Target: {log.targetId}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
