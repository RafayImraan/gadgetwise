import { NextResponse } from "next/server";
import {
  createOrderWithInventoryLock,
  orderNumberExists
} from "@/lib/storefront-db";
import { buildOrderQuote } from "@/lib/order-pricing";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { validateSelectedPaymentMethod } from "@/lib/payment-readiness";

function generateOrderNumber() {
  return `NXO-${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request);
    const limiter = checkRateLimit({
      key: `orders-create:${ip}`,
      limit: 20,
      windowMs: 60 * 1000
    });
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please retry shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000))
          }
        }
      );
    }

    const body = await request.json();

    const customer = body?.customer || {};
    const items = Array.isArray(body?.items) ? body.items : [];
    const deliveryOption = body?.deliveryOption || "standard";
    const paymentMethod = body?.paymentMethod || "Cash on Delivery";
    const paymentReference = String(body?.paymentReference || "").trim() || null;
    const paymentValidation = validateSelectedPaymentMethod(paymentMethod);
    if (!paymentValidation.ok) {
      return NextResponse.json({ error: paymentValidation.error }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.shippingAddress) {
      return NextResponse.json({ error: "Missing required customer fields." }, { status: 400 });
    }
    if (!String(customer.email).includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (paymentValidation.method !== "Cash on Delivery" && !paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required for online payment methods." },
        { status: 400 }
      );
    }

    const quote = await buildOrderQuote(items, deliveryOption);
    if (!quote.ok) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    let orderNumber = generateOrderNumber();
    while (await orderNumberExists(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    const createdResult = await createOrderWithInventoryLock({
      orderNumber,
      customerName: String(customer.fullName),
      customerEmail: String(customer.email),
      customerPhone: String(customer.phone),
      city: String(customer.city || ""),
      shippingAddress: String(customer.shippingAddress),
      billingAddress: customer.billingAddress ? String(customer.billingAddress) : null,
      deliveryOption,
      paymentMethod: paymentValidation.method,
      paymentStatus: paymentValidation.paymentStatus,
      paymentReference,
      status: "Order Confirmed",
      subtotal: quote.subtotal,
      shippingFee: quote.shippingFee,
      total: quote.total,
      items: quote.items
    });
    if (!createdResult.order) {
      return NextResponse.json(
        { error: createdResult.error || "Unable to lock inventory for this order." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderNumber: createdResult.order.orderNumber
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create order at the moment." },
      { status: 500 }
    );
  }
}
