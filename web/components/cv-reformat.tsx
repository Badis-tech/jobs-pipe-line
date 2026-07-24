"use client";

import { useState } from "react";
import type { GeneratedDocs } from "@/lib/cv-types";
import { CookingLoader } from "./cv-shared";
import { CvDocument } from "./cv-document";
import { useUiLang, ToolHeader, type Lang, type L } from "./cv-i18n";

// Rotating "cooking" phrases during the free-tier wait, per UI language.
const COOKING_PHRASES: Record<Lang, string[]> = {
  de: [
    "📄 Lese die bestehenden Unterlagen…",
    "🌍 Übersetze ins Deutsche…",
    "🇩🇪 Wandle in deutsches Format um…",
    "📐 Richte alles nach DIN 5008 aus…",
    "✨ Poliere jeden Satz…",
    "🔍 Korrekturlesen…",
    "Fast fertig! 🚀",
  ],
  en: [
    "📄 Reading the existing documents…",
    "🌍 Translating into German…",
    "🇩🇪 Converting to the German format…",
    "📐 Aligning everything to DIN 5008…",
    "✨ Polishing every sentence…",
    "🔍 Proofreading…",
    "Almost done! 🚀",
  ],
};

// UI copy, keyed by language. The output stays a German application regardless.
const UI = {
  badge: { de: "CV verbessern", en: "Improve CV" },
  title: {
    de: "Bestehende Bewerbung umwandeln",
    en: "Convert an existing application",
  },
  subtitle: {
    de: "Vorhandenen Lebenslauf einfügen oder als PDF/DOCX/TXT hochladen — wird in eine korrekte deutsche Bewerbung (Lebenslauf + Anschreiben) umgewandelt.",
    en: "Paste an existing CV or upload it (PDF/DOCX/TXT) — it's converted into a proper German application (CV + cover letter).",
  },
  panelTitle: { de: "Bestehende Bewerbung", en: "Existing application" },
  uploadIdle: {
    de: "📎 PDF, DOCX oder TXT hochladen — oder Text unten einfügen",
    en: "📎 Upload PDF, DOCX or TXT — or paste text below",
  },
  uploadReading: { de: "⏳ Datei wird gelesen…", en: "⏳ Reading file…" },
  scannedHint: {
    de: "Gescannte PDFs (reine Bilder) können nicht gelesen werden.",
    en: "Scanned PDFs (image-only) can't be read.",
  },
  readError: {
    de: "Datei konnte nicht gelesen werden.",
    en: "The file could not be read.",
  },
  textPlaceholder: {
    de: "CV / Lebenslauf hier einfügen (beliebige Sprache)…",
    en: "Paste your CV here (any language)…",
  },
  targetLabel: { de: "Optional — Zielstelle:", en: "Optional — target position:" },
  ausbildungPh: { de: "Angestrebte Ausbildung", en: "Desired apprenticeship" },
  companyPh: { de: "Firma", en: "Company" },
  contactPh: {
    de: "Ansprechpartner (z. B. Frau Müller)",
    en: "Contact person (e.g. Frau Müller)",
  },
  run: {
    de: "In deutsche Bewerbung umwandeln",
    en: "Convert to a German application",
  },
  running: { de: "Verarbeite…", en: "Processing…" },
  emptyPreview: { de: "Noch nichts umgewandelt.", en: "Nothing converted yet." },
  loaderHint: {
    de: "meist 40–90 Sekunden",
    en: "usually 40–90 seconds",
  },
} satisfies Record<string, L>;

export function CvReformat() {
  const { lang, t } = useUiLang();
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
      if (!res.ok) throw new Error(data.error ?? t(UI.readError));

      setText(data.text);
      setFileNote(
        data.pages
          ? lang === "de"
            ? `${data.pages} Seite(n) gelesen · ${data.text.length} Zeichen`
            : `${data.pages} page(s) read · ${data.text.length} characters`
          : lang === "de"
            ? `${data.text.length} Zeichen gelesen`
            : `${data.text.length} characters read`,
      );
    } catch (err) {
      setFileName(null);
      setError(err instanceof Error ? err.message : t(UI.readError));
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
    <div>
      <ToolHeader badge={UI.badge} title={UI.title} subtitle={UI.subtitle} />

      {/* Narrow input column; the A4 preview needs the rest of the width. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t(UI.panelTitle)}
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
              ? t(UI.uploadReading)
              : fileName
                ? `📎 ${fileName}`
                : t(UI.uploadIdle)}
          </label>
          <p className="mb-3 text-center text-xs text-zinc-400">
            {fileNote ?? t(UI.scannedHint)}
          </p>

          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(UI.textPlaceholder)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />

          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-zinc-500">{t(UI.targetLabel)}</p>
            <input value={ausbildungTitle} onChange={(e) => setAusbildung(e.target.value)}
              placeholder={t(UI.ausbildungPh)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
            <input value={company} onChange={(e) => setCompany(e.target.value)}
              placeholder={t(UI.companyPh)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
            <input value={contactPerson} onChange={(e) => setContact(e.target.value)}
              placeholder={t(UI.contactPh)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          </div>

          <button
            onClick={run}
            disabled={loading || extracting || text.trim().length < 30}
            className="mt-4 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? t(UI.running) : t(UI.run)}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div>
          {loading ? (
            <CookingLoader phrases={COOKING_PHRASES[lang]} hint={t(UI.loaderHint)} />
          ) : docs ? (
            <CvDocument docs={docs} />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-400 dark:border-zinc-700">
              {t(UI.emptyPreview)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
