import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const { email } = await getAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      {/* max-w-6xl matches the widest page (the CV tool) so the bar stays
          aligned with the content below it on every route. */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand font-bold text-white shadow-sm">
            A
          </span>
          <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ausbildung<span className="text-brand">Jobs</span>
          </span>
        </Link>
        <HeaderNav email={email} />
      </div>
    </header>
  );
}
