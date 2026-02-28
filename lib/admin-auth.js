import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeEnvValue } from "@/lib/env-utils";

const ADMIN_COOKIE_NAME = "nn_admin_session";

function getSessionSecret() {
  const value = normalizeEnvValue(process.env.ADMIN_SESSION_SECRET, "");
  return value && value.length >= 24 ? value : "";
}

function getAdminPassword() {
  const value = normalizeEnvValue(process.env.ADMIN_PASSWORD, "");
  return value;
}

function signPayload(payload) {
  const secret = getSessionSecret();
  if (!secret) {
    return "";
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function validateAdminPassword(password) {
  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return false;
  }
  const input = Buffer.from(String(password || ""));
  const reference = Buffer.from(adminPassword);

  if (input.length !== reference.length) {
    return false;
  }

  return crypto.timingSafeEqual(input, reference);
}

export async function createAdminSessionCookie() {
  const secret = getSessionSecret();
  if (!secret) {
    return false;
  }
  const expiresAt = String(Date.now() + 1000 * 60 * 60 * 24);
  const signature = crypto.createHmac("sha256", secret).update(expiresAt).digest("hex");
  const token = `${expiresAt}.${signature}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Number(expiresAt))
  });
  return true;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function isAdminAuthenticated() {
  if (!getSessionSecret()) {
    return false;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) {
    return false;
  }

  if (Number(expiresAt) < Date.now()) {
    return false;
  }

  const expected = signPayload(expiresAt);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export async function requireAdminAuth() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
