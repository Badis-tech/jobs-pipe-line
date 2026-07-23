import { getAuth } from "./auth";

// Simple owner/admin gate for internal tools (e.g. the CV generator).
// Set ADMIN_EMAILS in env as a comma-separated list of allowed emails.
// Uses getAuth() (local JWT verification) — no network round-trip per page.
export async function isAdmin(): Promise<boolean> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;

  const { email } = await getAuth();
  return Boolean(email && allowed.includes(email.toLowerCase()));
}
