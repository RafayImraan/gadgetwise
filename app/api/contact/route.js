import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/storefront-db";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `contact-submit:${ip}`,
      limit: 10,
      windowMs: 5 * 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000))
          }
        }
      );
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const phone = String(body?.phone || "").trim();
    const message = String(body?.message || "").trim();
    const honeypot = String(body?.company || "").trim();

    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await createContactMessage({
      name,
      email,
      phone: phone || null,
      message
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to submit message." }, { status: 500 });
  }
}
