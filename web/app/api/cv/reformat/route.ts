import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { reformatToGerman } from "@/lib/cv-engine";
import { saveCvDocument } from "@/lib/cv-store";

// Measured against the live free tier: a full structured generation takes
// 37-68s of body streaming, and we may fall through several models. The engine
// keeps its own 150s budget so it can still return a real error message.
// NOTE: the hosting plan must actually allow this ceiling.
export const maxDuration = 160;

// Internal-only: reformat an existing CV/cover-letter into German documents,
// then save under the logged-in admin. Admin-gated; key stays server-side.
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

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
    const docs = await reformatToGerman(
      text,
      {
        ausbildungTitle: body.ausbildungTitle,
        company: body.company,
        contactPerson: body.contactPerson,
      },
      request.signal,
    );
    const title = body.ausbildungTitle?.trim()
      ? `Import — ${body.ausbildungTitle.trim()}`
      : "Import — umgewandelte Bewerbung";
    const id = await saveCvDocument({
      title,
      mode: "reformat",
      input: { text, ...body },
      docs,
    });
    return NextResponse.json({ ...docs, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    console.error("CV reformat failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
