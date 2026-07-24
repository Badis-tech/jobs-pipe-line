"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiLang, type L } from "./cv-i18n";

// Secondary nav for the CV tool. A top tab bar (not a left sidebar) so the A4
// document preview gets the full page width, and so it scrolls cleanly on
// mobile instead of stacking a cramped column.
const NAV: { href: string; label: L; icon: string; exact?: boolean }[] = [
  {
    href: "/cv",
    label: { de: "Bewerbung erstellen", en: "Create application" },
    icon: "✍️",
    exact: true,
  },
  {
    href: "/cv/upload",
    label: { de: "CV verbessern", en: "Improve CV" },
    icon: "📄",
  },
  {
    href: "/cv/history",
    label: { de: "Meine Bewerbungen", en: "My applications" },
    icon: "🗂️",
  },
];

export function CvTabs() {
  const pathname = usePathname();
  const { t } = useUiLang();

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
