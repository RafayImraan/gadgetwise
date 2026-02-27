import { NextResponse } from "next/server";
import { changeCustomerPassword, getCurrentCustomer } from "@/lib/customer-auth";

export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newPassword = String(body?.newPassword || "");
    const result = await changeCustomerPassword(customer.id, newPassword);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update password." }, { status: 500 });
  }
}
