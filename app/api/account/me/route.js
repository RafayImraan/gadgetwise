import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ ok: false, customer: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      preferredLanguage: customer.preferredLanguage,
      addresses: customer.addresses || []
    }
  });
}
