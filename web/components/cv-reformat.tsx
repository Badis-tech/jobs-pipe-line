"use client";

import { useEffect, useState } from "react";

interface Docs {
  lebenslauf: string;
  anschreiben: string;
}

const COOKING_PHRASES = [
  "📄 Lese die bestehenden Unterlagen…",
  "🌍 Übersetze ins Deutsche…",
  "🇩🇪 Wandle in deutsches Format um…",
  "📐 Richte alles nach DIN 5008 aus…",
  "✨ Poliere jeden Satz…",
  "🔍 Korrekturlesen…",
  "Fast fertig! 🚀",
];

export function CvReformat() {
  const [text, setText] = useState("");
  const [ausbildungTitle, setAusbildung] = useState("");
  const [company, setCompany] = useState("");
  const [contactPerson, setContact] = useState("");
  const [docs, setDocs] = useState<Docs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const content = await f.text();
    setText(content);
  }

  async function run() {
    setLoading(true);
    setError(null);
    setDocs(null);
    try {
      const res = await fetch("/api/cv/reformat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ausbildungTitle, company, contactPerson }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDocs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Bestehende Bewerbung
        </h2>

        <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 transition-colors hover:border-brand/50 dark:border-zinc-700">
          <input type="file" accept=".txt,.md,.text" onChange={onFile} className="hidden" />
          {fileName ? `📎 ${fileName}` : "📎 .txt-Datei hochladen oder Text unten einfügen"}
        </label>

        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="CV / Lebenslauf hier einfügen (beliebige Sprache)…"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />

        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-zinc-500">Optional — Zielstelle:</p>
          <input value={ausbildungTitle} onChange={(e) => setAusbildung(e.target.value)}
            placeholder="Angestrebte Ausbildung"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <input value={company} onChange={(e) => setCompany(e.target.value)}
            placeholder="Firma"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <input value={contactPerson} onChange={(e) => setContact(e.target.value)}
            placeholder="Ansprechpartner (z. B. Frau Müller)"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        </div>

        <button
          onClick={run}
          disabled={loading || text.trim().length < 30}
          className="mt-4 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Verarbeite…" : "In deutsche Bewerbung umwandeln"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-6">
        {loading ? (
          <CookingLoader />
        ) : (
          <>
            <DocPanel title="Lebenslauf" content={docs?.lebenslauf} />
            <DocPanel title="Anschreiben" content={docs?.anschreiben} />
          </>
        )}
      </div>
    </div>
  );
}

function CookingLoader() {
  const [phrase, setPhrase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const p = setInterval(() => setPhrase((i) => (i + 1) % COOKING_PHRASES.length), 2500);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(p);
      clearInterval(t);
    };
  }, []);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand" />
      </div>
      <p className="mt-5 min-h-[1.5rem] text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {COOKING_PHRASES[phrase]}
      </p>
      <p className="mt-2 text-xs text-zinc-400">{elapsed}s · meist 15–30 Sekunden</p>
      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-brand" />
      </div>
    </div>
  );
}

function DocPanel({ title, content }: { title: string; content?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {content && (
          <button onClick={copy}
            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        )}
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200">
        {content ?? <span className="text-zinc-400">Noch nichts generiert.</span>}
      </pre>
    </div>
  );
}
