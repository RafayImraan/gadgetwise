import { NextResponse } from "next/server";
import { loginCustomer } from "@/lib/customer-auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `customer-login:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await loginCustomer({
      email: body?.email,
      password: body?.password
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to login right now." }, { status: 500 });
  }
}
