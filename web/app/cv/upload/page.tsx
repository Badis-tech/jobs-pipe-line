import { CvReformat } from "@/components/cv-reformat";

// Internal tool: reformat an existing CV/cover letter into German documents.
// Admin gate + sidebar live in the shared layout (app/cv/layout.tsx).
export default function CvUploadPage() {
  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          CV verbessern
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Bestehende Bewerbung umwandeln
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vorhandenen Lebenslauf einfügen oder als .txt hochladen — wird in eine
          korrekte deutsche Bewerbung (Lebenslauf + Anschreiben) umgewandelt.
        </p>
      </div>
      <CvReformat />
    </>
  );
}
