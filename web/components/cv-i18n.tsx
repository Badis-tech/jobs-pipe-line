"use client";

import { useEffect, useState } from "react";

// Shared UI-language plumbing for the CV tools. The toggle switches the *form*
// UI only — generated documents stay German (Lebenslauf + Anschreiben) for now.
// One localStorage key backs every tool, so a choice on one page carries over.
export type Lang = "de" | "en";
export type L = { de: string; en: string };

const LANG_KEY = "cv-form-lang";

export function useUiLang() {
  const [lang, setLang] = useState<Lang>("de");

  // Read after mount (not in a useState initializer) so server and first client
  // render agree on the "de" default and hydration stays clean.
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of a persisted preference on mount
    if (saved === "de" || saved === "en") setLang(saved);
  }, []);

  function choose(next: Lang) {
    setLang(next);
    window.localStorage.setItem(LANG_KEY, next);
  }

  const t = (v: L) => v[lang];

  return { lang, setLang: choose, t };
}

// EN / DE segmented pill.
export function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-zinc-300 p-0.5 text-xs font-semibold dark:border-zinc-700">
      {(["de", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2.5 py-1 uppercase transition-colors ${
            lang === l
              ? "bg-brand text-white"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// Tool heading (badge + title + subtitle) with the language toggle beside it.
// Lives in the client component so the toggle can switch the heading too.
export function ToolHeader({
  badge,
  title,
  subtitle,
  lang,
  onLang,
  t,
}: {
  badge: L;
  title: L;
  subtitle: L;
  lang: Lang;
  onLang: (l: Lang) => void;
  t: (v: L) => string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          {t(badge)}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t(title)}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t(subtitle)}</p>
      </div>
      <LangToggle lang={lang} onChange={onLang} />
    </div>
  );
}
