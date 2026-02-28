import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "nn_admin_session";

function getSessionSecret() {
  const value = String(process.env.ADMIN_SESSION_SECRET || "").trim();
  if (!value || value.length < 24) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 24 characters long.");
  }
  return value;
}

function getAdminPassword() {
  const value = String(process.env.ADMIN_PASSWORD || "");
  if (!value) {
    throw new Error("ADMIN_PASSWORD must be set.");
  }
  return value;
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function validateAdminPassword(password) {
  const input = Buffer.from(String(password || ""));
  const reference = Buffer.from(getAdminPassword());

  if (input.length !== reference.length) {
    return false;
  }

  return crypto.timingSafeEqual(input, reference);
}

export async function createAdminSessionCookie() {
  const expiresAt = String(Date.now() + 1000 * 60 * 60 * 24);
  const signature = signPayload(expiresAt);
  const token = `${expiresAt}.${signature}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Number(expiresAt))
  });
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
