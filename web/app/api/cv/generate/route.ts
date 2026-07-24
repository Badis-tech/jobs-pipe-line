import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { generateGermanDocs, type CandidateInput } from "@/lib/cv-engine";
import { saveCvDocument } from "@/lib/cv-store";

// Measured against the live free tier: a full structured generation takes
// 37-68s of body streaming, and we may fall through several models. The engine
// keeps its own 150s budget so it can still return a real error message.
// NOTE: the hosting plan must actually allow this ceiling.
export const maxDuration = 160;

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
    const docs = await generateGermanDocs(input, request.signal);
    // Best-effort save — don't fail the response if the insert hiccups.
    const id = await saveCvDocument({
      title: `${input.fullName.trim()} — ${input.ausbildungTitle.trim()}`,
      mode: "form",
      input,
      docs,
    });
    return NextResponse.json({ ...docs, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    console.error("CV generation failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
