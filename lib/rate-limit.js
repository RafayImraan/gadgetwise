const rateBuckets = new Map();

function getHeaderValue(headersLike, key) {
  if (!headersLike) {
    return "";
  }

  if (typeof headersLike.get === "function") {
    return String(headersLike.get(key) || "").trim();
  }

  const lowered = key.toLowerCase();
  const direct = headersLike[key] || headersLike[lowered];
  return String(direct || "").trim();
}

export function getIpFromHeaders(headersLike) {
  const forwardedFor = getHeaderValue(headersLike, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = getHeaderValue(headersLike, "x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function getIpFromRequest(request) {
  return getIpFromHeaders(request?.headers);
}

export function checkRateLimit({ key, limit, windowMs }) {
  const safeKey = String(key || "").trim();
  if (!safeKey || !Number.isFinite(limit) || !Number.isFinite(windowMs) || limit <= 0 || windowMs <= 0) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterMs: 0 };
  }

  const now = Date.now();
  const bucket = rateBuckets.get(safeKey);

  if (!bucket || now >= bucket.resetAt) {
    const next = {
      count: 1,
      resetAt: now + windowMs
    };
    rateBuckets.set(safeKey, next);
    return {
      allowed: true,
      remaining: Math.max(0, limit - next.count),
      retryAfterMs: 0
    };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.resetAt - now)
    };
  }

  bucket.count += 1;
  rateBuckets.set(safeKey, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: 0
  };
}
