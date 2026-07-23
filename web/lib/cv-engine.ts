// German CV (Lebenslauf) + cover letter (Anschreiben) generation via Google
// Gemini (free tier). REST API only — no SDK dependency. Server-side only:
// the API key must never reach the browser.

export interface CandidateInput {
  // Personal
  fullName: string;
  address?: string;
  phone?: string;
  email?: string;
  birthDate?: string; // e.g. "15.03.2007"
  birthPlace?: string;
  nationality?: string;
  // Target
  ausbildungTitle: string; // e.g. "Kaufmann im Einzelhandel"
  company?: string;
  companyAddress?: string;
  contactPerson?: string; // e.g. "Frau Müller" — for the salutation
  startDate?: string; // e.g. "September 2027"
  // Background (free text — the model structures it)
  education?: string; // schools, degrees, grades
  experience?: string; // jobs, internships (Praktika)
  skills?: string; // IT, other Kenntnisse
  languages?: string; // e.g. "Deutsch (B2), Englisch (fließend), Arabisch (Muttersprache)"
  hobbies?: string;
  motivation?: string; // why this Ausbildung / this company — free text
}

const SYSTEM_RULES = `Du bist ein Experte für deutsche Bewerbungsunterlagen für Ausbildungsstellen.
Du erstellst tadellose, kulturell korrekte deutsche Lebensläufe und Anschreiben.

STRIKTE REGELN FÜR DEN LEBENSLAUF (tabellarisch, umgekehrt chronologisch — neueste zuerst):
- Abschnitte in dieser Reihenfolge: "Persönliche Daten", "Schulbildung", "Praktika / Berufserfahrung" (nur wenn vorhanden), "Kenntnisse", "Sprachen", "Hobbys" (optional).
- KEIN "Karriereziel"- oder "Objective"-Abschnitt (das ist amerikanisch, in Deutschland unüblich).
- Persönliche Daten: Name, Adresse, Telefon, E-Mail, Geburtsdatum und -ort, Staatsangehörigkeit. Familienstand nur wenn angegeben (freiwillig wegen AGG).
- Datumsformat: TT.MM.JJJJ oder "Monat JJJJ". Zeiträume z. B. "09/2023 – 07/2026".
- Am Ende: "Ort, Datum" und Platz für die Unterschrift.
- Maximal 1–2 Seiten, sachlich, keine Übertreibungen.

STRIKTE REGELN FÜR DAS ANSCHREIBEN (DIN 5008):
- Absenderblock (Bewerber), dann Empfängerblock (Firma).
- Ort und Datum rechtsbündig.
- Betreffzeile fett, OHNE das Wort "Betreff:". Nennt die konkrete Ausbildungsstelle.
- Anrede: "Sehr geehrte Frau [Name]," / "Sehr geehrter Herr [Name]," oder "Sehr geehrte Damen und Herren," wenn kein Name.
- 3–4 prägnante Absätze: (1) Motivation & Bezug zur Stelle, (2) schulische Stärken & relevante Erfahrung, (3) warum genau DIESE Firma, (4) Schlusssatz mit Gesprächswunsch.
- Abschluss: "Mit freundlichen Grüßen", dann Name.
- Formell, motiviert, authentisch — deutsche Personaler legen bei Azubis großen Wert auf Motivation. Keine Floskeln, keine Übertreibung.

Schreibe fehlerfrei auf Deutsch. Erfinde KEINE Fakten, die nicht in den Angaben stehen. Wenn Angaben fehlen, lasse den Platzhalter in eckigen Klammern, z. B. [Adresse].`;

interface GeneratedDocs {
  lebenslauf: string;
  anschreiben: string;
}

function buildUserPrompt(c: CandidateInput): string {
  const lines: string[] = [];
  const add = (label: string, val?: string) => {
    if (val && val.trim()) lines.push(`${label}: ${val.trim()}`);
  };
  add("Vollständiger Name", c.fullName);
  add("Adresse", c.address);
  add("Telefon", c.phone);
  add("E-Mail", c.email);
  add("Geburtsdatum", c.birthDate);
  add("Geburtsort", c.birthPlace);
  add("Staatsangehörigkeit", c.nationality);
  add("Angestrebte Ausbildung", c.ausbildungTitle);
  add("Firma", c.company);
  add("Firmenadresse", c.companyAddress);
  add("Ansprechpartner", c.contactPerson);
  add("Ausbildungsbeginn", c.startDate);
  add("Schulbildung / Noten", c.education);
  add("Praktika / Berufserfahrung", c.experience);
  add("Kenntnisse", c.skills);
  add("Sprachen", c.languages);
  add("Hobbys", c.hobbies);
  add("Motivation (Stichpunkte)", c.motivation);

  return `Erstelle aus diesen Angaben (a) einen tabellarischen Lebenslauf und (b) ein Anschreiben.

ANGABEN:
${lines.join("\n")}

Gib deine Antwort als striktes JSON zurück, exakt in diesem Format, ohne Markdown-Codeblöcke:
{"lebenslauf": "<vollständiger Lebenslauf als Text>", "anschreiben": "<vollständiges Anschreiben als Text>"}`;
}

export async function generateGermanDocs(c: CandidateInput): Promise<GeneratedDocs> {
  return callModels([
    { role: "system", content: SYSTEM_RULES },
    { role: "user", content: buildUserPrompt(c) },
  ]);
}

// Reformat an existing CV/cover letter (any language/format) into proper German
// Ausbildung documents. Optionally target a specific Ausbildung/company.
export async function reformatToGerman(
  existingText: string,
  target?: { ausbildungTitle?: string; company?: string; contactPerson?: string },
): Promise<GeneratedDocs> {
  const t: string[] = [];
  if (target?.ausbildungTitle) t.push(`Angestrebte Ausbildung: ${target.ausbildungTitle}`);
  if (target?.company) t.push(`Firma: ${target.company}`);
  if (target?.contactPerson) t.push(`Ansprechpartner: ${target.contactPerson}`);

  const prompt = `Hier ist ein bestehender Lebenslauf / eine bestehende Bewerbung (evtl. in einer anderen Sprache oder einem anderen Format).
Wandle die Informationen in einen korrekten deutschen tabellarischen Lebenslauf UND ein passendes Anschreiben nach deutschen Standards um.
Übersetze bei Bedarf ins Deutsche. Behalte nur echte Fakten aus dem Original — erfinde nichts. Fehlende Pflichtangaben als [Platzhalter] markieren.
${t.length ? "\nZIEL:\n" + t.join("\n") + "\n" : ""}
BESTEHENDE UNTERLAGEN:
"""
${existingText.slice(0, 12000)}
"""

Gib deine Antwort als striktes JSON zurück, ohne Markdown-Codeblöcke:
{"lebenslauf": "<vollständiger Lebenslauf als Text>", "anschreiben": "<vollständiges Anschreiben als Text>"}`;

  return callModels([
    { role: "system", content: SYSTEM_RULES },
    { role: "user", content: prompt },
  ]);
}

// Shared OpenRouter caller: tries free models in order, falls through on
// rate-limit/error, parses the JSON {lebenslauf, anschreiben} response.
async function callModels(
  messages: { role: string; content: string }[],
): Promise<GeneratedDocs> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");

  const models = (process.env.OPENROUTER_MODELS ??
    "nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free,openai/gpt-oss-20b:free")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  let lastErr = "";
  for (const model of models) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      lastErr = `${model} rate-limited`;
      continue; // try next free model
    }
    if (!res.ok) {
      lastErr = `${model} error ${res.status}: ${(await res.text()).slice(0, 200)}`;
      continue;
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) {
      lastErr = `${model} returned no content`;
      continue;
    }

    // Some models wrap JSON in ```json fences — strip them defensively.
    let s = text.trim();
    if (s.startsWith("```")) {
      s = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(s) as GeneratedDocs;
      if (parsed.lebenslauf && parsed.anschreiben) return parsed;
      lastErr = `${model} JSON missing fields`;
    } catch {
      lastErr = `${model} returned malformed JSON`;
    }
  }

  throw new Error(`All models failed. Last: ${lastErr}`);
}
