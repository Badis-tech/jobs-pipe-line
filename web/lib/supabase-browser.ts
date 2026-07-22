import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Browser (client component) Supabase client. Reads the logged-in session from
// cookies set by the server. Use inside "use client" components.
export function createSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
