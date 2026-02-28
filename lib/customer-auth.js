import crypto from "node:crypto";
import { cookies } from "next/headers";
import { normalizeEnvValue } from "@/lib/env-utils";
import {
  createCustomerAccount,
  getCustomerByEmail,
  getCustomerById,
  updateCustomerPassword
} from "@/lib/storefront-db";

const CUSTOMER_COOKIE_NAME = "nn_customer_session";

function getSessionSecret() {
  const value = normalizeEnvValue(
    process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET,
    ""
  );
  return value && value.length >= 24 ? value : "";
}

function signPayload(payload) {
  const secret = getSessionSecret();
  if (!secret) {
    return "";
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) {
    return false;
  }
  const derived = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  const input = Buffer.from(derived);
  const reference = Buffer.from(hash);
  if (input.length !== reference.length) {
    return false;
  }
  return crypto.timingSafeEqual(input, reference);
}

export async function createCustomerSessionCookie(customerId) {
  const id = String(customerId || "").trim();
  const secret = getSessionSecret();
  if (!id || !secret) {
    return false;
  }
  const expiresAt = String(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const payload = `${id}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Number(expiresAt))
  });
  return true;
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function getCustomerSessionCustomerId() {
  if (!getSessionSecret()) {
    return "";
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) {
    return "";
  }

  const [customerId, expiresAt, signature] = token.split(".");
  if (!customerId || !expiresAt || !signature) {
    return "";
  }

  if (Number(expiresAt) < Date.now()) {
    return "";
  }

  const payload = `${customerId}.${expiresAt}`;
  const expected = signPayload(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) {
    return "";
  }
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return "";
  }
  return customerId;
}

export async function getCurrentCustomer() {
  const customerId = await getCustomerSessionCustomerId();
  if (!customerId) {
    return null;
  }
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return null;
  }
  return customer;
}

export async function registerCustomer({ fullName, email, phone, password }) {
  const safeName = String(fullName || "").trim();
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");
  if (!safeName || !safeEmail || !safePassword || !safeEmail.includes("@")) {
    return { ok: false, error: "Please provide valid registration details." };
  }
  if (safePassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }

  const existing = await getCustomerByEmail(safeEmail);
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = makePasswordHash(safePassword);
  const customer = await createCustomerAccount({
    fullName: safeName,
    email: safeEmail,
    phone: String(phone || "").trim(),
    passwordHash
  });
  if (!customer) {
    return { ok: false, error: "Unable to create account right now." };
  }

  const sessionCreated = await createCustomerSessionCookie(customer.id);
  if (!sessionCreated) {
    return { ok: false, error: "Session is not configured. Contact support." };
  }
  return { ok: true, customer };
}

export async function loginCustomer({ email, password }) {
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePassword = String(password || "");
  if (!safeEmail || !safePassword) {
    return { ok: false, error: "Email and password are required." };
  }

  const customer = await getCustomerByEmail(safeEmail);
  if (!customer || !verifyPasswordHash(safePassword, customer.passwordHash)) {
    return { ok: false, error: "Invalid email or password." };
  }

  const sessionCreated = await createCustomerSessionCookie(customer.id);
  if (!sessionCreated) {
    return { ok: false, error: "Session is not configured. Contact support." };
  }
  return { ok: true, customer };
}

export async function changeCustomerPassword(customerId, newPassword) {
  const safe = String(newPassword || "");
  if (safe.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }
  const hash = makePasswordHash(safe);
  const customer = await updateCustomerPassword(customerId, hash);
  if (!customer) {
    return { ok: false, error: "Unable to update password." };
  }
  return { ok: true };
}
