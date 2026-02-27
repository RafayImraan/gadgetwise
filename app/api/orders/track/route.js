import { NextResponse } from "next/server";
import { findTrackedOrder } from "@/lib/storefront-db";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

const statuses = [
  "Order Confirmed",
  "Packed and Ready",
  "Shipped to Courier",
  "In Transit",
  "Out for Delivery",
  "Delivered"
];

function buildTimeline(currentStatus) {
  const safeStatus = currentStatus || statuses[0];
  const currentIndex = statuses.indexOf(safeStatus);
  return statuses.map((label, index) => ({
    label,
    done: index <= (currentIndex === -1 ? 0 : currentIndex)
  }));
}

function estimateDeliveryDate(order) {
  const createdAt = new Date(order?.createdAt || Date.now());
  const status = String(order?.status || "");
  if (status === "Delivered") {
    return createdAt.toISOString();
  }
  const addDays = status === "Out for Delivery" ? 0 : status === "In Transit" ? 1 : 3;
  const eta = new Date(createdAt.valueOf() + addDays * 24 * 60 * 60 * 1000);
  return eta.toISOString();
}

export async function GET(request) {
  const ip = getIpFromRequest(request);
  const limiter = checkRateLimit({
    key: `orders-track:${ip}`,
    limit: 40,
    windowMs: 60 * 1000
  });
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many tracking requests. Please retry shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000))
        }
      }
    );
  }

  const url = new URL(request.url);
  const orderNumber = String(url.searchParams.get("order") || "").trim();
  const phone = String(url.searchParams.get("phone") || "").trim();

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "Order number and phone are required." }, { status: 400 });
  }

  const order = await findTrackedOrder(orderNumber, phone);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingCode: order.trackingCode || `TCS-${order.orderNumber.slice(-6)}`,
      courierName: "TCS",
      courierTrackUrl: `https://www.tcsexpress.com/track/${encodeURIComponent(
        order.trackingCode || order.orderNumber
      )}`,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      estimatedDeliveryAt: estimateDeliveryDate(order),
      total: order.total,
      timeline: buildTimeline(order.status),
      statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : []
    }
  });
}
