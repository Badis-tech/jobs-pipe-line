import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Magic-link / OAuth callback. Supabase redirects here with a `code` we
// exchange for a session cookie, then bounce the user to `next` (or home).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";

  // Only allow internal paths. Reject protocol-relative ("//host") and absolute
  // URLs to prevent open-redirect. Falls back to home.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Something went wrong — send them back to login with a flag.
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
