function hasValue(value) {
  return Boolean(String(value || "").trim());
}

function isProductionLike() {
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

export function getPaymentReadiness() {
  const stripeKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  const stripeWebhook = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const paypalClientId = String(process.env.PAYPAL_CLIENT_ID || "").trim();
  const paypalClientSecret = String(process.env.PAYPAL_CLIENT_SECRET || "").trim();
  const paypalWebhook = String(process.env.PAYPAL_WEBHOOK_ID || "").trim();
  const paypalEnv = String(process.env.PAYPAL_ENV || "sandbox").trim().toLowerCase();
  const easypaisaId = String(process.env.EASYPAISA_MERCHANT_ID || "").trim();
  const jazzcashId = String(process.env.JAZZCASH_MERCHANT_ID || "").trim();
  const prod = isProductionLike();

  const stripeConfigured = hasValue(stripeKey) && hasValue(stripeWebhook);
  const stripeLiveLike = stripeKey.startsWith("sk_live_") && stripeWebhook.startsWith("whsec_");

  const paypalConfigured =
    hasValue(paypalClientId) && hasValue(paypalClientSecret) && hasValue(paypalWebhook);
  const paypalEnvValid = paypalEnv === "sandbox" || paypalEnv === "live";

  return {
    stripe: {
      configured: stripeConfigured,
      liveSafe: !prod || stripeLiveLike,
      notes:
        !stripeConfigured
          ? "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET"
          : prod && !stripeLiveLike
            ? "Production should use live Stripe credentials."
            : "Ready"
    },
    paypal: {
      configured: paypalConfigured,
      env: paypalEnv,
      envValid: paypalEnvValid,
      liveSafe: !prod || paypalEnv === "live",
      notes:
        !paypalConfigured
          ? "Missing PayPal credentials or PAYPAL_WEBHOOK_ID"
          : !paypalEnvValid
            ? "PAYPAL_ENV must be sandbox or live"
            : prod && paypalEnv !== "live"
              ? "Production should use PAYPAL_ENV=live."
              : "Ready"
    },
    easypaisa: {
      configured: hasValue(easypaisaId),
      notes: hasValue(easypaisaId) ? "Ready" : "Missing EASYPAISA_MERCHANT_ID"
    },
    jazzcash: {
      configured: hasValue(jazzcashId),
      notes: hasValue(jazzcashId) ? "Ready" : "Missing JAZZCASH_MERCHANT_ID"
    }
  };
}

export function validateSelectedPaymentMethod(method) {
  const safeMethod = String(method || "Cash on Delivery").trim();
  const readiness = getPaymentReadiness();
  if (safeMethod === "Cash on Delivery") {
    return { ok: true, method: safeMethod, paymentStatus: "pending_cod" };
  }
  if (safeMethod === "Stripe (Card)") {
    if (!readiness.stripe.configured || !readiness.stripe.liveSafe) {
      return { ok: false, error: "Stripe is not fully configured for this environment." };
    }
    return { ok: true, method: safeMethod, paymentStatus: "pending_online" };
  }
  if (safeMethod === "PayPal") {
    if (
      !readiness.paypal.configured ||
      !readiness.paypal.envValid ||
      !readiness.paypal.liveSafe
    ) {
      return { ok: false, error: "PayPal is not fully configured for this environment." };
    }
    return { ok: true, method: safeMethod, paymentStatus: "pending_online" };
  }
  if (safeMethod === "EasyPaisa") {
    if (!readiness.easypaisa.configured) {
      return { ok: false, error: "EasyPaisa is not configured yet." };
    }
    return { ok: true, method: safeMethod, paymentStatus: "pending_online" };
  }
  if (safeMethod === "JazzCash") {
    if (!readiness.jazzcash.configured) {
      return { ok: false, error: "JazzCash is not configured yet." };
    }
    return { ok: true, method: safeMethod, paymentStatus: "pending_online" };
  }
  return { ok: false, error: "Unsupported payment method selected." };
}
