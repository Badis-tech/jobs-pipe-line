"use client";

import { useState } from "react";
import type { GeneratedDocs } from "@/lib/cv-types";
import { anschreibenToText, lebenslaufToText } from "@/lib/cv-render";
import { AnschreibenSheet, LebenslaufSheet } from "./cv-sheets";

// Renders the structured documents as real A4 pages and prints them to PDF.
//
// PDF export goes through the browser's own print pipeline (Save as PDF) rather
// than a server-side renderer: it produces selectable, vector text at true A4
// size with correct German hyphenation, needs no extra dependency, and cannot
// time out on a serverless function the way a headless-Chrome render would.

type Target = "lebenslauf" | "anschreiben" | "beides";

function print(target: Target) {
  const body = document.body;
  const wanted =
    target === "beides"
      ? ["lebenslauf", "anschreiben"]
      : [target];

  const sheets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-cv-sheet]"),
  );
  for (const el of sheets) {
    el.classList.toggle(
      "cv-print-active",
      wanted.includes(el.dataset.cvSheet ?? ""),
    );
  }
  body.classList.add("cv-printing");

  // Clean up after the dialog closes, whichever way it closes.
  const cleanup = () => {
    body.classList.remove("cv-printing");
    for (const el of sheets) el.classList.remove("cv-print-active");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

export function CvDocument({ docs }: { docs: GeneratedDocs }) {
  const [tab, setTab] = useState<"lebenslauf" | "anschreiben">("lebenslauf");

  return (
    <div>
      {/* Toolbar — screen only; `visibility` hiding in print keeps it off paper. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
          {(["lebenslauf", "anschreiben"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-brand text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t === "lebenslauf" ? "Lebenslauf" : "Anschreiben"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <CopyButton
            label="Text kopieren"
            text={
              tab === "lebenslauf"
                ? lebenslaufToText(docs.lebenslauf)
                : anschreibenToText(docs.anschreiben)
            }
          />
          <button
            onClick={() => print(tab)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Diese Seite als PDF
          </button>
          <button
            onClick={() => print("beides")}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Als PDF speichern
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        Im Druckdialog <strong>„Als PDF speichern“</strong> wählen · Papierformat A4 ·
        Ränder „Standard“ oder „Keine“ · Kopf- und Fußzeilen deaktivieren.
      </p>

      {/* Both sheets stay mounted so "Als PDF speichern" can print the pair;
          the inactive one is hidden on screen only. */}
      <div className="overflow-x-auto">
        <div className={tab === "lebenslauf" ? "" : "hidden print:block"}>
          <SheetFrame>
            <LebenslaufSheet cv={docs.lebenslauf} />
          </SheetFrame>
        </div>
        <div className={tab === "anschreiben" ? "" : "hidden print:block"}>
          <SheetFrame>
            <AnschreibenSheet a={docs.anschreiben} />
          </SheetFrame>
        </div>
      </div>
    </div>
  );
}

function SheetFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-fit rounded-sm shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800 print:shadow-none print:ring-0">
      {children}
    </div>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context / denied) — leave the label alone.
    }
  }
  return (
    <button
      onClick={copy}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {copied ? "Kopiert ✓" : label}
    </button>
  );
}

