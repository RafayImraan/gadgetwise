import { Suspense } from "react";
import TrackOrderClient from "@/app/track-order/track-order-client";

export const metadata = {
  title: "Track Order",
  description: "Track shipment status and customer support updates for your order."
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="section-block">
          <h1>Track Your Shipment</h1>
          <p>Loading order tracking form...</p>
        </main>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
