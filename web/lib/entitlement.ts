import { createSupabaseServer } from "./supabase-server";

// Server-side entitlement check. Returns true only when the logged-in user has
// an active/trialing (or cancelled-but-not-expired) subscription. Backed by the
// RLS-protected has_active_sub() DB function — the browser cannot fake this.
export async function isEntitled(): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("has_active_sub");
  if (error) return false;
  return data === true;
}
