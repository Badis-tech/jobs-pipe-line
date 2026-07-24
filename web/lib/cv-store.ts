import { createSupabaseServer } from "./supabase-server";
import { docsToText } from "./cv-render";
import { normalizeDocs, type GeneratedDocs } from "./cv-types";

interface SaveArgs {
  title: string;
  mode: "form" | "reformat";
  input: unknown;
  docs: GeneratedDocs;
}

// Persist a generated document set under the logged-in user. RLS ensures the
// row is owned by that user. Returns the new row id, or null on failure (we
// never block the generation response on a save error — best effort).
export async function saveCvDocument(args: SaveArgs): Promise<string | null> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Persist both forms: the structured JSON drives the PDF/print view, while
    // the rendered text keeps the copy button and legacy readers working.
    const text = docsToText(args.docs);

    const { data, error } = await supabase
      .from("cv_documents")
      .insert({
        user_id: user.id,
        title: args.title.slice(0, 200),
        mode: args.mode,
        input: args.input as never,
        lebenslauf: text.lebenslauf,
        anschreiben: text.anschreiben,
        lebenslauf_json: args.docs.lebenslauf as never,
        anschreiben_json: args.docs.anschreiben as never,
      })
      .select("id")
      .single();

    if (error) {
      console.error("saveCvDocument failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error("saveCvDocument threw:", e);
    return null;
  }
}

export interface CvDocListItem {
  id: string;
  title: string;
  mode: string;
  created_at: string;
}

export interface CvDocFull extends CvDocListItem {
  lebenslauf: string;
  anschreiben: string;
  /** Structured form — null for rows generated before structured output. */
  docs: GeneratedDocs | null;
}

// List the logged-in user's saved documents, newest first.
export async function listCvDocuments(): Promise<CvDocListItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("cv_documents")
    .select("id, title, mode, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listCvDocuments failed:", error.message);
    return [];
  }
  return data ?? [];
}

// Fetch one document (RLS ensures it belongs to the caller).
export async function getCvDocument(id: string): Promise<CvDocFull | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("cv_documents")
    .select(
      "id, title, mode, created_at, lebenslauf, anschreiben, lebenslauf_json, anschreiben_json",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getCvDocument failed:", error.message);
    return null;
  }
  if (!data) return null;

  const { lebenslauf_json, anschreiben_json, ...rest } = data;

  // Re-normalize on read rather than trusting the stored blob: rows written by
  // an older shape of the schema must not crash the renderer.
  let docs: GeneratedDocs | null = null;
  if (lebenslauf_json && anschreiben_json) {
    try {
      docs = normalizeDocs({
        lebenslauf: lebenslauf_json,
        anschreiben: anschreiben_json,
      });
    } catch (e) {
      console.error("stored cv json failed validation:", e);
    }
  }

  return { ...rest, docs };
}
