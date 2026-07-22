import { createSupabaseServer } from "./supabase-server";

// Simple owner/admin gate for internal tools (e.g. the CV generator).
// Set ADMIN_EMAILS in env as a comma-separated list of allowed emails.
// No new tables — the check is just "is the logged-in user's email on the list".
export async function isAdmin(): Promise<boolean> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return Boolean(email && allowed.includes(email));
}
