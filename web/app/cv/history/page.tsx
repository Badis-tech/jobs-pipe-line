import Link from "next/link";
import { listCvDocuments } from "@/lib/cv-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CvHistoryPage() {
  const docs = await listCvDocuments();

  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          Meine Bewerbungen
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Gespeicherte Bewerbungen
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Alle generierten Lebensläufe &amp; Anschreiben. Klicken zum Öffnen.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Noch keine Bewerbungen gespeichert. Erstelle deine erste unter{" "}
          <Link href="/cv" className="text-brand underline">
            Bewerbung erstellen
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/cv/history/${d.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-brand/40 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {d.title}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDate(d.created_at)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  {d.mode === "reformat" ? "Import" : "Neu"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
