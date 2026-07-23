import { NextResponse } from "next/server";
import { generateGermanDocs, type CandidateInput } from "@/lib/cv-engine";

// Internal-only: generate a German Lebenslauf + Anschreiben. Gated to admin
// emails. The Gemini API key stays server-side.
export async function POST(request: Request) {
  // Admin gate temporarily disabled — all features open for testing.
  // To re-lock: if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

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
    return NextResponse.json(docs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    console.error("CV generation failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
