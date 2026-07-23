import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { generateGermanDocs, type CandidateInput } from "@/lib/cv-engine";
import { saveCvDocument } from "@/lib/cv-store";

// Internal-only: generate a German Lebenslauf + Anschreiben, then save it under
// the logged-in admin's history. Admin-gated; API key stays server-side.
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  let input: CandidateInput;
  try {
    input = (await request.json()) as CandidateInput;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!input.fullName?.trim() || !input.ausbildungTitle?.trim()) {
    return NextResponse.json(
      { error: "fullName and ausbildungTitle are required" },
      { status: 400 },
    );
  }

  try {
    const docs = await generateGermanDocs(input);
    // Best-effort save — don't fail the response if the insert hiccups.
    const id = await saveCvDocument({
      title: `${input.fullName.trim()} — ${input.ausbildungTitle.trim()}`,
      mode: "form",
      input,
      lebenslauf: docs.lebenslauf,
      anschreiben: docs.anschreiben,
    });
    return NextResponse.json({ ...docs, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    console.error("CV generation failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
