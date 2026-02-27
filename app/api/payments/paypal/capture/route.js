import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/payments";
import { updateOrderPaymentByReference } from "@/lib/storefront-db";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { validateSelectedPaymentMethod } from "@/lib/payment-readiness";

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `paypal-capture:${ip}`,
      limit: 25,
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
    const methodCheck = validateSelectedPaymentMethod("PayPal");
    if (!methodCheck.ok) {
      return NextResponse.json({ error: methodCheck.error }, { status: 400 });
    }
    const orderId = String(body?.orderId || body?.paymentReference || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "PayPal order id is required." }, { status: 400 });
    }

    const capture = await capturePayPalOrder(orderId);
    const status = String(capture?.status || "").toUpperCase();
    const mappedStatus = status === "COMPLETED" ? "paid" : "pending_online";

    await updateOrderPaymentByReference(orderId, {
      paymentStatus: mappedStatus,
      paymentMethod: "PayPal"
    });

    return NextResponse.json({
      ok: true,
      status: capture?.status || "UNKNOWN",
      paymentReference: orderId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unable to capture PayPal order." },
      { status: 500 }
    );
  }
}
