"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/cv", label: "Bewerbung erstellen", icon: "✍️", exact: true },
  { href: "/cv/upload", label: "CV verbessern", icon: "📄", exact: false },
];

export function CvSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 sm:w-56">
      <div className="sm:sticky sm:top-20">
        <div className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 sm:block">
          Bewerbungs-Werkzeug
        </div>
        <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 sm:block">
          Intern · nur für Admins. Ausgabe immer prüfen, bevor sie an Kunden geht.
        </div>
      </div>
    </aside>
  );
}
