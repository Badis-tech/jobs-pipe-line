"use client";

import { useState } from "react";

export function CvDocView({
  lebenslauf,
  anschreiben,
}: {
  lebenslauf: string;
  anschreiben: string;
}) {
  return (
    <div className="space-y-6">
      <DocPanel title="Lebenslauf" content={lebenslauf} />
      <DocPanel title="Anschreiben" content={anschreiben} />
    </div>
  );
}

function DocPanel({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <button
          onClick={copy}
          className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>
      <pre className="overflow-auto whitespace-pre-wrap px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200">
        {content}
      </pre>
    </div>
  );
}
