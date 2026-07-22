"use client";

import { useState } from "react";

interface Docs {
  lebenslauf: string;
  anschreiben: string;
}

const FIELDS: { name: string; label: string; placeholder?: string; textarea?: boolean; required?: boolean }[] = [
  { name: "fullName", label: "Vollständiger Name *", placeholder: "Max Mustermann", required: true },
  { name: "ausbildungTitle", label: "Angestrebte Ausbildung *", placeholder: "Kaufmann im Einzelhandel", required: true },
  { name: "email", label: "E-Mail", placeholder: "max@example.com" },
  { name: "phone", label: "Telefon", placeholder: "+49 170 1234567" },
  { name: "address", label: "Adresse", placeholder: "Musterstraße 1, 10115 Berlin" },
  { name: "birthDate", label: "Geburtsdatum", placeholder: "15.03.2007" },
  { name: "birthPlace", label: "Geburtsort", placeholder: "Tunis" },
  { name: "nationality", label: "Staatsangehörigkeit", placeholder: "tunesisch" },
  { name: "company", label: "Firma", placeholder: "Lidl Dienstleistung GmbH" },
  { name: "companyAddress", label: "Firmenadresse", placeholder: "..." },
  { name: "contactPerson", label: "Ansprechpartner", placeholder: "Frau Müller" },
  { name: "startDate", label: "Ausbildungsbeginn", placeholder: "September 2027" },
  { name: "education", label: "Schulbildung / Noten", textarea: true, placeholder: "Abitur 2026, Note 2,1 ..." },
  { name: "experience", label: "Praktika / Berufserfahrung", textarea: true },
  { name: "skills", label: "Kenntnisse (IT, etc.)", textarea: true, placeholder: "MS Office, ..." },
  { name: "languages", label: "Sprachen", placeholder: "Deutsch (B2), Englisch, Arabisch (Muttersprache)" },
  { name: "hobbies", label: "Hobbys", placeholder: "Fußball, Lesen" },
  { name: "motivation", label: "Motivation (Stichpunkte)", textarea: true, placeholder: "Warum diese Ausbildung? Warum diese Firma?" },
];

export function CvGenerator() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Docs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setDocs(null);
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDocs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Input form */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Angaben</h2>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {f.label}
              </label>
              {f.textarea ? (
                <textarea
                  rows={2}
                  value={form[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              ) : (
                <input
                  value={form[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={generate}
          disabled={loading || !form.fullName || !form.ausbildungTitle}
          className="mt-4 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Generiere…" : "Lebenslauf + Anschreiben generieren"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Output */}
      <div className="space-y-6">
        <DocPanel title="Lebenslauf" content={docs?.lebenslauf} />
        <DocPanel title="Anschreiben" content={docs?.anschreiben} />
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
          <button
            onClick={copy}
            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
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
