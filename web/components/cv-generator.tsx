"use client";

import { useState } from "react";
import type { GeneratedDocs } from "@/lib/cv-types";
import { CookingLoader } from "./cv-shared";
import { CvDocument } from "./cv-document";
import { useUiLang, ToolHeader, type Lang, type L } from "./cv-i18n";

// Rotating "cooking" phrases during the 40-90s free-tier wait, per UI language.
const COOKING_PHRASES: Record<Lang, string[]> = {
  de: [
    "👨‍🍳 Wir kochen deinen Lebenslauf…",
    "📝 Formuliere das perfekte Anschreiben…",
    "🇩🇪 Prüfe die deutschen Bewerbungsregeln…",
    "✨ Poliere jeden Satz auf Hochglanz…",
    "☕ Der KI-Personaler trinkt noch einen Kaffee…",
    "📐 Richte alles nach DIN 5008 aus…",
    "🎯 Finde die richtigen Worte für die Motivation…",
    "🔍 Korrekturlesen auf Rechtschreibung…",
    "Fast fertig — gleich hast du deine Bewerbung! 🚀",
  ],
  en: [
    "👨‍🍳 Cooking up your CV…",
    "📝 Crafting the perfect cover letter…",
    "🇩🇪 Checking the German application rules…",
    "✨ Polishing every sentence…",
    "☕ The AI recruiter is grabbing a coffee…",
    "📐 Aligning everything to DIN 5008…",
    "🎯 Finding the right words for your motivation…",
    "🔍 Proofreading for spelling…",
    "Almost done — your application is nearly ready! 🚀",
  ],
};

// Static UI copy, keyed by language.
const UI = {
  badge: { de: "Bewerbung erstellen", en: "Create application" },
  title: { de: "Neue Bewerbung generieren", en: "Generate a new application" },
  subtitle: {
    de: "Lebenslauf & Anschreiben nach deutschen Standards (DIN 5008, tabellarisch) aus den Angaben erzeugen.",
    en: "Generate a CV & cover letter to German standards (DIN 5008, tabular) from your details.",
  },
  step: { de: "Schritt", en: "Step" },
  of: { de: "von", en: "of" },
  back: { de: "Zurück", en: "Back" },
  next: { de: "Weiter", en: "Next" },
  generate: {
    de: "Lebenslauf + Anschreiben generieren",
    en: "Generate CV + cover letter",
  },
  generating: { de: "Generiere…", en: "Generating…" },
  emptyPreview: {
    de: "Noch nichts generiert. Fülle links die Angaben aus.",
    en: "Nothing generated yet. Fill in the details on the left.",
  },
  loaderHint: {
    de: "Die kostenlose KI braucht meist 40–90 Sekunden",
    en: "The free AI usually takes 40–90 seconds",
  },
  missing: {
    de: "Bitte Pflichtfelder ausfüllen: Name und angestrebte Ausbildung.",
    en: "Please fill in the required fields: name and desired apprenticeship.",
  },
} satisfies Record<string, L>;

type Field = {
  name: string;
  label: L;
  placeholder?: L;
  textarea?: boolean;
  required?: boolean;
};

// The 18 inputs, grouped into wizard steps. Field order within a step matches
// the old single-column form.
const STEPS: { title: L; fields: Field[] }[] = [
  {
    title: { de: "Persönliche Daten", en: "Personal details" },
    fields: [
      {
        name: "fullName",
        label: { de: "Vollständiger Name *", en: "Full name *" },
        placeholder: { de: "Max Mustermann", en: "Max Mustermann" },
        required: true,
      },
      {
        name: "email",
        label: { de: "E-Mail", en: "Email" },
        placeholder: { de: "max@example.com", en: "max@example.com" },
      },
      {
        name: "phone",
        label: { de: "Telefon", en: "Phone" },
        placeholder: { de: "+49 170 1234567", en: "+49 170 1234567" },
      },
      {
        name: "address",
        label: { de: "Adresse", en: "Address" },
        placeholder: {
          de: "Musterstraße 1, 10115 Berlin",
          en: "Musterstraße 1, 10115 Berlin",
        },
      },
      {
        name: "birthDate",
        label: { de: "Geburtsdatum", en: "Date of birth" },
        placeholder: { de: "15.03.2007", en: "15.03.2007" },
      },
      {
        name: "birthPlace",
        label: { de: "Geburtsort", en: "Place of birth" },
        placeholder: { de: "Tunis", en: "Tunis" },
      },
      {
        name: "nationality",
        label: { de: "Staatsangehörigkeit", en: "Nationality" },
        placeholder: { de: "tunesisch", en: "Tunisian" },
      },
    ],
  },
  {
    title: { de: "Ausbildung & Firma", en: "Apprenticeship & company" },
    fields: [
      {
        name: "ausbildungTitle",
        label: { de: "Angestrebte Ausbildung *", en: "Desired apprenticeship *" },
        placeholder: {
          de: "Kaufmann im Einzelhandel",
          en: "Kaufmann im Einzelhandel",
        },
        required: true,
      },
      {
        name: "company",
        label: { de: "Firma", en: "Company" },
        placeholder: {
          de: "Lidl Dienstleistung GmbH",
          en: "Lidl Dienstleistung GmbH",
        },
      },
      {
        name: "companyAddress",
        label: { de: "Firmenadresse", en: "Company address" },
        placeholder: { de: "Musterallee 5, 10117 Berlin", en: "Musterallee 5, 10117 Berlin" },
      },
      {
        name: "contactPerson",
        label: { de: "Ansprechpartner", en: "Contact person" },
        placeholder: { de: "Frau Müller", en: "Frau Müller" },
      },
      {
        name: "startDate",
        label: { de: "Ausbildungsbeginn", en: "Start date" },
        placeholder: { de: "September 2027", en: "September 2027" },
      },
    ],
  },
  {
    title: { de: "Werdegang", en: "Background" },
    fields: [
      {
        name: "education",
        label: { de: "Schulbildung / Noten", en: "Education / grades" },
        textarea: true,
        placeholder: {
          de: "Abitur 2026, Note 2,1 …",
          en: "High-school diploma 2026, grade 2.1 …",
        },
      },
      {
        name: "experience",
        label: {
          de: "Praktika / Berufserfahrung",
          en: "Internships / work experience",
        },
        textarea: true,
      },
      {
        name: "skills",
        label: { de: "Kenntnisse (IT, etc.)", en: "Skills (IT, etc.)" },
        textarea: true,
        placeholder: { de: "MS Office, …", en: "MS Office, …" },
      },
      {
        name: "languages",
        label: { de: "Sprachen", en: "Languages" },
        placeholder: {
          de: "Deutsch (B2), Englisch, Arabisch (Muttersprache)",
          en: "German (B2), English, Arabic (native)",
        },
      },
      {
        name: "hobbies",
        label: { de: "Hobbys", en: "Hobbies" },
        placeholder: { de: "Fußball, Lesen", en: "Football, reading" },
      },
    ],
  },
  {
    title: { de: "Motivation", en: "Motivation" },
    fields: [
      {
        name: "motivation",
        label: { de: "Motivation (Stichpunkte)", en: "Motivation (bullet points)" },
        textarea: true,
        placeholder: {
          de: "Warum diese Ausbildung? Warum diese Firma?",
          en: "Why this apprenticeship? Why this company?",
        },
      },
    ],
  },
];

export function CvGenerator() {
  const { lang, t } = useUiLang();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<GeneratedDocs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  const isLast = step === STEPS.length - 1;
  const canGenerate = Boolean(form.fullName?.trim() && form.ausbildungTitle?.trim());

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

  const current = STEPS[step];

  return (
    <div>
      <ToolHeader badge={UI.badge} title={UI.title} subtitle={UI.subtitle} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Wizard */}
        <div>
          {/* Progress: label + clickable step dots + bar */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
              <span>
                {t(UI.step)} {step + 1} {t(UI.of)} {STEPS.length}
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {t(current.title)}
              </span>
            </div>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`${t(UI.step)} ${i + 1}: ${t(s.title)}`}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Fields for the current step */}
          <div className="space-y-3">
            {current.fields.map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {t(f.label)}
                </label>
                {f.textarea ? (
                  <textarea
                    rows={3}
                    value={form[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder ? t(f.placeholder) : undefined}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                ) : (
                  <input
                    value={form[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder ? t(f.placeholder) : undefined}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t(UI.back)}
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="ml-auto rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
              >
                {t(UI.next)}
              </button>
            ) : (
              <button
                onClick={generate}
                disabled={loading || !canGenerate}
                className="ml-auto rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {loading ? t(UI.generating) : t(UI.generate)}
              </button>
            )}
          </div>
          {isLast && !canGenerate && (
            <p className="mt-2 text-xs text-amber-600">{t(UI.missing)}</p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Output */}
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
