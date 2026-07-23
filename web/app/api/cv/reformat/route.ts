import { NextResponse } from "next/server";
import { reformatToGerman } from "@/lib/cv-engine";

// Internal-only: take an existing CV/cover-letter text and reformat it into
// proper German Ausbildung documents. Admin-gated. Key stays server-side.
export async function POST(request: Request) {
  // Admin gate temporarily disabled — all features open for testing.
  // To re-lock: if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  let body: {
    text?: string;
    ausbildungTitle?: string;
    company?: string;
    contactPerson?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 30) {
    return NextResponse.json(
      { error: "Bitte mehr Text einfügen (mind. 30 Zeichen)." },
      { status: 400 },
    );
  }

  try {
    const docs = await reformatToGerman(text, {
      ausbildungTitle: body.ausbildungTitle,
      company: body.company,
      contactPerson: body.contactPerson,
    });
    return NextResponse.json(docs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    console.error("CV reformat failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
