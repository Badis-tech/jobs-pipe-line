"use client";

import { useEffect, useState } from "react";

// Shared building blocks for the Bewerbungs-Werkzeug. Both the form generator
// and the reformat tool render the same output panels and the same waiting
// state — only the status phrases differ.

// A read-only plain-text panel with a copy button. Still used for history rows
// written before structured output, which have text but no schema to lay out.
// `content` is optional so the same component covers the empty placeholder.
export function DocPanel({
  title,
  content,
  scroll = true,
}: {
  title: string;
  content?: string;
  /** History pages show the full document; the tools cap the height. */
  scroll?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is blocked without a secure context or user permission —
      // silently leave the button unchanged rather than throwing at the user.
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {content && (
          <button
            onClick={copy}
            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        )}
      </div>
      <pre
        className={`overflow-auto whitespace-pre-wrap px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 ${
          scroll ? "max-h-96" : ""
        }`}
      >
        {content ?? <span className="text-zinc-400">Noch nichts generiert.</span>}
      </pre>
    </div>
  );
}

// Rotating status phrases during the (40-90s) free-tier generation so the wait
// feels alive instead of frozen.
export function CookingLoader({
  phrases,
  hint = "meist 40–90 Sekunden",
}: {
  phrases: string[];
  hint?: string;
}) {
  const [phrase, setPhrase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const p = setInterval(() => setPhrase((i) => (i + 1) % phrases.length), 2500);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(p);
      clearInterval(t);
    };
  }, [phrases.length]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
      {/* Spinning brand ring */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand" />
      </div>
      <p className="mt-5 min-h-[1.5rem] text-sm font-medium text-zinc-800 transition-all dark:text-zinc-200">
        {phrases[phrase]}
      </p>
      <p className="mt-2 text-xs text-zinc-400">
        {elapsed}s · {hint}
      </p>
      {/* Indeterminate progress bar */}
      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-brand" />
      </div>
    </div>
  );
}
