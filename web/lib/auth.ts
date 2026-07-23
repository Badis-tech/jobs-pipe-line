import { createSupabaseServer } from "./supabase-server";

// Fast auth read. getClaims() verifies the JWT locally (no network round-trip)
// when the project uses asymmetric signing keys, falling back to a network call
// only when it must. This replaces per-request supabase.auth.getUser() network
// calls that were adding ~200-400ms to every page load.
export interface AuthInfo {
  userId: string | null;
  email: string | null;
}

export async function getAuth(): Promise<AuthInfo> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return { userId: null, email: null };
  }
  const claims = data.claims as Record<string, unknown>;
  return {
    userId: (claims.sub as string) ?? null,
    email: (claims.email as string) ?? null,
  };
}
