import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { CvGenerator } from "@/components/cv-generator";

// Internal tool: German CV + cover letter generator. Admin-only.
export default async function CvPage() {
  if (!(await isAdmin())) {
    // Not an admin (or not logged in) — bounce to home. Keeps the tool private.
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Internes Werkzeug
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Bewerbung generieren
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lebenslauf &amp; Anschreiben nach deutschen Standards (DIN 5008, tabellarisch).
          Ausgabe prüfen, anpassen, an den Kunden liefern.
        </p>
      </div>
      <CvGenerator />
    </main>
  );
}
