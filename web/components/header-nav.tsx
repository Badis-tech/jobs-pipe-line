"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { useUiLang, LangToggle, type L } from "./cv-i18n";

// Primary app navigation. Client-side so links can show an active state and the
// labels follow the shared language. `email` is resolved on the server and
// passed down (auth is server-only).
const NAV: { href: string; label: L; exact?: boolean }[] = [
  { href: "/", label: { de: "Jobs", en: "Jobs" }, exact: true },
  { href: "/cv", label: { de: "Bewerbung", en: "Application" } },
];

const T = {
  signOut: { de: "Abmelden", en: "Sign out" },
  signIn: { de: "Anmelden", en: "Sign in" },
} satisfies Record<string, L>;

export function HeaderNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const { t } = useUiLang();

  return (
    <nav className="flex items-center gap-1 text-sm sm:gap-2">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
              active
                ? "bg-brand/10 text-brand"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-brand dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {t(item.label)}
          </Link>
        );
      })}

      <LangToggle />

      {email ? (
        <>
          <span className="hidden text-zinc-500 md:inline">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {t(T.signOut)}
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-brand px-4 py-1.5 font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          {t(T.signIn)}
        </Link>
      )}
    </nav>
  );
}
