import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

// Magic-link / OAuth callback. Supabase redirects here with a `code` we
// exchange for a session cookie, then bounce the user to `next` (or a sensible
// default: /cv for admins, home for everyone else).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");

  // Only allow internal paths. Reject protocol-relative ("//host") and absolute
  // URLs to prevent open-redirect.
  const explicitNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Honour an explicit destination; otherwise send admins to the internal
      // CV tool and regular users to the jobs home.
      const dest = explicitNext ?? ((await isAdmin()) ? "/cv" : "/");
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }

  // Something went wrong — send them back to login with a flag.
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
