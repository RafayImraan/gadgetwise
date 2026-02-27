import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getOrdersByCustomerEmail } from "@/lib/storefront-db";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getOrdersByCustomerEmail(customer.email);
  return NextResponse.json({
    ok: true,
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      total: order.total
    }))
  });
}
