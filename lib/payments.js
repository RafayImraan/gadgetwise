import crypto from "node:crypto";

function toAmountString(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe < 0) {
    return "0.00";
  }
  return (Math.round(safe * 100) / 100).toFixed(2);
}

export function getPayPalBaseUrl() {
  const mode = String(process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  if (mode === "live") {
    return "https://api-m.paypal.com";
  }
  return "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken() {
  const clientId = String(process.env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || "Unable to get PayPal access token.");
  }
  return data.access_token;
}

export async function createPayPalOrder({ total, currency = "USD", orderNumberHint = "" }) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(orderNumberHint || `ORD-${Date.now()}`),
          amount: {
            currency_code: String(currency || "USD").toUpperCase(),
            value: toAmountString(total)
          }
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok || !data?.id) {
    throw new Error(data?.message || "Unable to create PayPal order.");
  }

  const approvalLink = Array.isArray(data.links)
    ? data.links.find((link) => link.rel === "approve")?.href || ""
    : "";

  return {
    id: data.id,
    status: data.status,
    approvalLink
  };
}

export async function capturePayPalOrder(orderId) {
  const safeOrderId = String(orderId || "").trim();
  if (!safeOrderId) {
    throw new Error("PayPal order id is required.");
  }
  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${safeOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to capture PayPal order.");
  }
  return data;
}

export async function verifyPayPalWebhookSignature({
  requestBody,
  headers,
  webhookId
}) {
  const safeWebhookId = String(webhookId || process.env.PAYPAL_WEBHOOK_ID || "").trim();
  if (!safeWebhookId) {
    return false;
  }

  const transmissionId = String(headers?.get("paypal-transmission-id") || "").trim();
  const transmissionTime = String(headers?.get("paypal-transmission-time") || "").trim();
  const certUrl = String(headers?.get("paypal-cert-url") || "").trim();
  const authAlgo = String(headers?.get("paypal-auth-algo") || "").trim();
  const transmissionSig = String(headers?.get("paypal-transmission-sig") || "").trim();
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: safeWebhookId,
      webhook_event: requestBody
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return false;
  }
  return String(data?.verification_status || "").toUpperCase() === "SUCCESS";
}

export async function createStripePaymentIntent({ amount, currency = "pkr", metadata = {} }) {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  const params = new URLSearchParams();
  params.set("amount", String(Math.max(1, Math.floor(Number(amount) || 0))));
  params.set("currency", String(currency || "pkr").toLowerCase());
  params.set("automatic_payment_methods[enabled]", "true");

  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (!key || value === undefined || value === null) {
      return;
    }
    params.set(`metadata[${key}]`, String(value));
  });

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const data = await response.json();
  if (!response.ok || !data?.id) {
    throw new Error(data?.error?.message || "Unable to create Stripe payment intent.");
  }

  return {
    id: data.id,
    clientSecret: data.client_secret,
    status: data.status
  };
}

export function verifyStripeWebhookSignature({ payload, signatureHeader, webhookSecret }) {
  const header = String(signatureHeader || "").trim();
  const secret = String(webhookSecret || "").trim();
  if (!header || !secret || !payload) {
    return false;
  }

  const parts = header.split(",").map((item) => item.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const v1Part = parts.find((part) => part.startsWith("v1="));
  if (!timestampPart || !v1Part) {
    return false;
  }

  const timestamp = timestampPart.slice(2);
  const signature = v1Part.slice(3);
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
