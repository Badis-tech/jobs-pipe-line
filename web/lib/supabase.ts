import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Read-only anonymous client. If auth is added later, switch to @supabase/ssr
// clients (browser + server) and keep this module as the single entry point.
export function createSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
