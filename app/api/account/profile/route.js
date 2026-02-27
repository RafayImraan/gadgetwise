import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { updateCustomerProfile } from "@/lib/storefront-db";

export async function PATCH(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateCustomerProfile(customer.id, {
      fullName: body?.fullName,
      phone: body?.phone,
      preferredLanguage: body?.preferredLanguage
    });
    if (!updated) {
      return NextResponse.json({ error: "Unable to update profile." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
