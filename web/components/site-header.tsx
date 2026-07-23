import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { signOut } from "@/app/auth/actions";

export async function SiteHeader() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand font-bold text-white shadow-sm">
            A
          </span>
          <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ausbildung<span className="text-brand">Jobs</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/cv"
            className="rounded-md px-2.5 py-1.5 font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-brand dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Bewerbung
          </Link>
          {user ? (
            <>
              <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand px-4 py-1.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
