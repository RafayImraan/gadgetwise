import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { upsertCustomerAddress } from "@/lib/storefront-db";

export async function POST(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await upsertCustomerAddress(customer.id, {
      id: body?.id,
      label: body?.label,
      recipientName: body?.recipientName,
      phone: body?.phone,
      city: body?.city,
      address: body?.address,
      isDefault: Boolean(body?.isDefault)
    });
    if (!updated) {
      return NextResponse.json({ error: "Unable to save address." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, addresses: updated.addresses || [] });
  } catch (error) {
    return NextResponse.json({ error: "Unable to save address." }, { status: 500 });
  }
}
