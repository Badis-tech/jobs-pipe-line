"use client";

import { useState } from "react";
import type { GeneratedDocs } from "@/lib/cv-types";
import { CookingLoader } from "./cv-shared";
import { CvDocument } from "./cv-document";

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
  const [docs, setDocs] = useState<GeneratedDocs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [fileNote, setFileNote] = useState<string | null>(null);

  // Upload goes through /api/cv/extract so PDF and DOCX are parsed server-side.
  // Reading the file client-side with f.text() only ever worked for .txt — a
  // PDF came through as binary noise and got sent to the model as-is.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    // Reset the input so re-picking the same file after an error re-triggers.
    e.target.value = "";
    if (!f) return;

    setFileName(f.name);
    setFileNote(null);
    setError(null);
    setExtracting(true);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/cv/extract", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Datei konnte nicht gelesen werden.");

      setText(data.text);
      setFileNote(
        data.pages
          ? `${data.pages} Seite(n) gelesen · ${data.text.length} Zeichen`
          : `${data.text.length} Zeichen gelesen`,
      );
    } catch (err) {
      setFileName(null);
      setError(err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.");
    } finally {
      setExtracting(false);
    }
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
    // Narrow input column; the A4 preview needs the rest of the width.
    <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div>
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Bestehende Bewerbung
        </h2>

        <label className="mb-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-500 transition-colors hover:border-brand/50 dark:border-zinc-700">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md,.text,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={onFile}
            disabled={extracting}
            className="hidden"
          />
          {extracting
            ? "⏳ Datei wird gelesen…"
            : fileName
              ? `📎 ${fileName}`
              : "📎 PDF, DOCX oder TXT hochladen — oder Text unten einfügen"}
        </label>
        <p className="mb-3 text-center text-xs text-zinc-400">
          {fileNote ?? "Gescannte PDFs (reine Bilder) können nicht gelesen werden."}
        </p>

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
          disabled={loading || extracting || text.trim().length < 30}
          className="mt-4 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Verarbeite…" : "In deutsche Bewerbung umwandeln"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div>
        {loading ? (
          <CookingLoader phrases={COOKING_PHRASES} />
        ) : docs ? (
          <CvDocument docs={docs} />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-400 dark:border-zinc-700">
            Noch nichts umgewandelt.
          </div>
        )}
      </div>
    </div>
  );
}

