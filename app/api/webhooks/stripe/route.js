import { NextResponse } from "next/server";
import {
  updateOrderPaymentByOrderNumber,
  updateOrderPaymentByReference
} from "@/lib/storefront-db";
import { verifyStripeWebhookSignature } from "@/lib/payments";

function mapStripeEventToStatus(eventType) {
  switch (eventType) {
    case "payment_intent.succeeded":
      return "paid";
    case "payment_intent.payment_failed":
      return "failed";
    case "payment_intent.canceled":
      return "cancelled";
    default:
      return "";
  }
}

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
    }

    const verified = verifyStripeWebhookSignature({
      payload,
      signatureHeader: signature,
      webhookSecret
    });
    if (!verified) {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const eventType = String(event?.type || "");
    const dataObject = event?.data?.object || {};
    const paymentIntentId = String(dataObject?.id || "").trim();
    const orderNumber = String(dataObject?.metadata?.orderNumber || "").trim();
    const mappedStatus = mapStripeEventToStatus(eventType);

    if (mappedStatus && paymentIntentId) {
      if (orderNumber) {
        await updateOrderPaymentByOrderNumber(orderNumber, {
          paymentStatus: mappedStatus,
          paymentReference: paymentIntentId,
          paymentMethod: "Stripe (Card)"
        });
      } else {
        await updateOrderPaymentByReference(paymentIntentId, {
          paymentStatus: mappedStatus,
          paymentMethod: "Stripe (Card)"
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to process Stripe webhook." }, { status: 500 });
  }
}
