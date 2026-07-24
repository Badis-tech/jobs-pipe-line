import type { GeneratedDocs } from "@/lib/cv-types";
import { CvDocument } from "./cv-document";
import { DocPanel } from "./cv-shared";

// Saved document set on the history detail page.
//
// Rows written before structured output have only the rendered text, so there
// is no schema to lay out — those fall back to plain panels. Everything newer
// gets the full A4 view with PDF export.
export function CvDocView({
  docs,
  lebenslauf,
  anschreiben,
}: {
  docs: GeneratedDocs | null;
  lebenslauf: string;
  anschreiben: string;
}) {
  if (docs) return <CvDocument docs={docs} />;

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        Diese Bewerbung wurde vor der PDF-Funktion erstellt und liegt nur als Text
        vor. Erzeuge sie neu, um sie als PDF zu speichern.
      </p>
      <DocPanel title="Lebenslauf" content={lebenslauf} scroll={false} />
      <DocPanel title="Anschreiben" content={anschreiben} scroll={false} />
    </div>
  );
}
