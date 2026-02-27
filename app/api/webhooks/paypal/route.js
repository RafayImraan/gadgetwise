import { NextResponse } from "next/server";
import { updateOrderPaymentByReference } from "@/lib/storefront-db";
import { verifyPayPalWebhookSignature } from "@/lib/payments";

function mapPayPalStatus(eventType) {
  switch (String(eventType || "").toUpperCase()) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return "paid";
    case "PAYMENT.CAPTURE.DENIED":
      return "failed";
    case "PAYMENT.CAPTURE.REFUNDED":
      return "refunded";
    default:
      return "";
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const verified = await verifyPayPalWebhookSignature({
      requestBody: body,
      headers: request.headers,
      webhookId: process.env.PAYPAL_WEBHOOK_ID
    });
    if (!verified) {
      return NextResponse.json({ error: "Invalid PayPal signature." }, { status: 400 });
    }

    const eventType = String(body?.event_type || "");
    const status = mapPayPalStatus(eventType);
    const paymentReference = String(body?.resource?.supplementary_data?.related_ids?.order_id || "").trim();

    if (status && paymentReference) {
      await updateOrderPaymentByReference(paymentReference, {
        paymentStatus: status,
        paymentMethod: "PayPal"
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to process PayPal webhook." }, { status: 500 });
  }
}
