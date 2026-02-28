import { revalidatePath } from "next/cache";
import {
  createAdminAuditLog,
  getAdminOrders,
  updateOrderPayment,
  updateOrderStatus
} from "@/lib/storefront-db";
import { requireAdminAuth } from "@/lib/admin-auth";

const statusOptions = [
  "Order Confirmed",
  "Packed and Ready",
  "Shipped to Courier",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export const metadata = {
  title: "Admin Orders",
  description: "Review and update order statuses."
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminAuth();

  const orders = await getAdminOrders();

  async function updateStatusAction(formData) {
    "use server";
    await requireAdminAuth();
    const orderId = String(formData.get("orderId") || "");
    const status = String(formData.get("status") || "");
    const trackingCode = String(formData.get("trackingCode") || "").trim();

    if (!orderId || !status) {
      return;
    }

    await updateOrderStatus(orderId, {
      status,
      trackingCode
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "order_status_updated",
      scope: "orders",
      targetId: orderId,
      meta: { status, trackingCode }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/track-order");
  }

  async function updatePaymentAction(formData) {
    "use server";
    await requireAdminAuth();
    const orderId = String(formData.get("orderId") || "").trim();
    const paymentStatus = String(formData.get("paymentStatus") || "").trim();
    const paymentReference = String(formData.get("paymentReference") || "").trim();
    const paymentMethod = String(formData.get("paymentMethod") || "").trim();
    if (!orderId || !paymentStatus) {
      return;
    }

    await updateOrderPayment(orderId, {
      paymentStatus,
      paymentReference,
      paymentMethod
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "order_payment_updated",
      scope: "orders",
      targetId: orderId,
      meta: { paymentStatus, paymentMethod, paymentReference }
    });

    revalidatePath("/admin/orders");
  }

  return (
    <section className="panel-card">
      <h2>Orders</h2>
      {!orders.length ? <p>No orders yet.</p> : null}
      <div className="admin-list">
        {orders.map((order) => (
          <article key={order.id} className="admin-order-card">
            <header>
              <h3>{order.orderNumber}</h3>
              <p>
                {order.customerName} | {order.customerPhone}
              </p>
              <p>
                Total: Rs. {order.total.toLocaleString("en-PK")} | Created:{" "}
                {new Date(order.createdAt).toLocaleDateString("en-PK")}
              </p>
              <p>
                Payment: {order.paymentMethod} | Status: {order.paymentStatus || "pending"}
              </p>
            </header>

            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} x {item.quantity} (Rs. {item.total.toLocaleString("en-PK")})
                </li>
              ))}
            </ul>

            <form action={updateStatusAction} className="admin-order-form">
              <input type="hidden" name="orderId" value={order.id} />
              <label>
                Status
                <select name="status" defaultValue={order.status}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tracking Code
                <input type="text" name="trackingCode" defaultValue={order.trackingCode || ""} />
              </label>
              <button className="btn" type="submit">
                Update Order
              </button>
            </form>

            <form action={updatePaymentAction} className="admin-order-form">
              <input type="hidden" name="orderId" value={order.id} />
              <label>
                Payment Status
                <select name="paymentStatus" defaultValue={order.paymentStatus || "pending"}>
                  <option value="pending">pending</option>
                  <option value="pending_cod">pending_cod</option>
                  <option value="pending_online">pending_online</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="refunded">refunded</option>
                </select>
              </label>
              <label>
                Payment Method
                <input type="text" name="paymentMethod" defaultValue={order.paymentMethod || ""} />
              </label>
              <label>
                Payment Reference
                <input
                  type="text"
                  name="paymentReference"
                  defaultValue={order.paymentReference || ""}
                />
              </label>
              <button className="btn secondary" type="submit">
                Update Payment
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}



