import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { extractCvText, ExtractError, MAX_UPLOAD_BYTES } from "@/lib/cv-extract";

// PDF parsing needs Node APIs (Buffer, pdfjs) — not available on edge.
export const runtime = "nodejs";
// Parsing a large PDF is measured in seconds, not the default sub-second budget.
export const maxDuration = 30;

// Internal-only: turn an uploaded PDF/DOCX/TXT CV into plain text the reformat
// step can consume. Kept separate from /api/cv/reformat so the (slow, flaky)
// upload can fail on its own and the user still keeps the editable text box.
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }
  // Cheap pre-check before we buffer the whole thing into memory.
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Datei zu groß (max. ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).` },
      { status: 413 },
    );
  }

  try {
    const result = await extractCvText(file);
    return NextResponse.json(result);
  } catch (e) {
    // ExtractError messages are written for the applicant — safe to surface.
    if (e instanceof ExtractError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    console.error("CV extract failed:", e);
    return NextResponse.json(
      { error: "Datei konnte nicht verarbeitet werden." },
      { status: 500 },
    );
  }
}
