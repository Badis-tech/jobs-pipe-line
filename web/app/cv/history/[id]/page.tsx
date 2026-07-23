import Link from "next/link";
import { notFound } from "next/navigation";
import { getCvDocument } from "@/lib/cv-store";
import { CvDocView } from "@/components/cv-doc-view";

export default async function CvDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getCvDocument(id);
  if (!doc) notFound();

  return (
    <>
      <div className="mb-6">
        <Link href="/cv/history" className="text-sm text-zinc-500 underline hover:text-brand">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {doc.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date(doc.created_at).toLocaleString("de-DE")}
        </p>
      </div>
      <CvDocView lebenslauf={doc.lebenslauf} anschreiben={doc.anschreiben} />
    </>
  );
}
