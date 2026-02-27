import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/customer-auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `customer-register:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await registerCustomer({
      fullName: body?.fullName,
      email: body?.email,
      phone: body?.phone,
      password: body?.password
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to register account." }, { status: 500 });
  }
}
