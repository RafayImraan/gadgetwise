import { NextResponse } from "next/server";
import { upsertNewsletterSubscriber } from "@/lib/storefront-db";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `newsletter-submit:${ip}`,
      limit: 12,
      windowMs: 5 * 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000))
          }
        }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const source = String(body?.source || "website").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    await upsertNewsletterSubscriber({
      email,
      source: source || "website"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to subscribe at this time." }, { status: 500 });
  }
}
