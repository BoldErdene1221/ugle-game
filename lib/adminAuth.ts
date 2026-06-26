import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const cookieName = "admin_session";
const maxAgeSeconds = 60 * 60 * 8;

function requirePassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required");
  }
  return password;
}

function signature(payload: string) {
  return crypto.createHmac("sha256", requirePassword()).update(payload).digest("base64url");
}

export function createAdminToken() {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const payload = `admin:${expiresAt}`;
  return `${payload}.${signature(payload)}`;
}

export function isValidAdminToken(token?: string) {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const [, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = signature(payload);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function isAdminRequest() {
  return isValidAdminToken(cookies().get(cookieName)?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
}
