import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Server (Server Component / Route Handler / Server Action) Supabase client.
// Next 16: cookies() is async. Server Components cannot set cookies, so writes
// are swallowed there; the proxy (proxy.ts) is responsible for refreshing the
// session cookie. In Route Handlers / Server Actions the set calls succeed.
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — safe to ignore, the proxy
            // refreshes the session.
          }
        },
      },
    },
  );
}
