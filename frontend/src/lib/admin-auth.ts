import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "daeasy-admin";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error("ADMIN_PASSWORD 환경변수가 필요합니다.");
  }
  return pw;
}

export function makeCookieValue(password: string): string {
  return hash(password);
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function isValidCookieValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = makeCookieValue(getAdminPassword());
  return safeEqualHex(cookieValue, expected);
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return isValidCookieValue(store.get(ADMIN_COOKIE_NAME)?.value);
}

export function verifyPassword(input: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(hash(input), "hex");
  const b = Buffer.from(hash(expected), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
