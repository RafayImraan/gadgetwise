import { NextResponse } from "next/server";
import { buildOrderQuote } from "@/lib/order-pricing";
import { createStripePaymentIntent } from "@/lib/payments";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { validateSelectedPaymentMethod } from "@/lib/payment-readiness";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `stripe-intent:${ip}`,
      limit: 15,
      windowMs: 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please retry shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000)) }
        }
      );
    }

    const body = await request.json();
    const methodCheck = validateSelectedPaymentMethod("Stripe (Card)");
    if (!methodCheck.ok) {
      return NextResponse.json({ error: methodCheck.error }, { status: 400 });
    }
    const items = Array.isArray(body?.items) ? body.items : [];
    const deliveryOption = String(body?.deliveryOption || "standard");
    const orderNumber = String(body?.orderNumber || "").trim();

    const quote = await buildOrderQuote(items, deliveryOption);
    if (!quote.ok) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    const amountInMinor = quote.total * 100;
    const intent = await createStripePaymentIntent({
      amount: amountInMinor,
      currency: "pkr",
      metadata: {
        orderNumber,
        cartTotalPkr: quote.total
      }
    });

    return NextResponse.json({
      ok: true,
      paymentProvider: "stripe",
      paymentReference: intent.id,
      clientSecret: intent.clientSecret,
      total: quote.total,
      currency: "PKR"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unable to initialize Stripe payment." },
      { status: 500 }
    );
  }
}
