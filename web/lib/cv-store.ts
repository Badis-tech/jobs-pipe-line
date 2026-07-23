import { createSupabaseServer } from "./supabase-server";

interface SaveArgs {
  title: string;
  mode: "form" | "reformat";
  input: unknown;
  lebenslauf: string;
  anschreiben: string;
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

    const { data, error } = await supabase
      .from("cv_documents")
      .insert({
        user_id: user.id,
        title: args.title.slice(0, 200),
        mode: args.mode,
        input: args.input as never,
        lebenslauf: args.lebenslauf,
        anschreiben: args.anschreiben,
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
    .select("id, title, mode, created_at, lebenslauf, anschreiben")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getCvDocument failed:", error.message);
    return null;
  }
  return data;
}
