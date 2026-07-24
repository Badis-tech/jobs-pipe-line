// German CV (Lebenslauf) + cover letter (Anschreiben) generation via OpenRouter
// free models. REST API only — no SDK dependency. Server-side only: the API key
// must never reach the browser.
//
// The model returns the structured schema from cv-types, not prose; layout and
// DIN 5008 formatting are the renderer's job.

import { normalizeDocs, ShapeError, type GeneratedDocs } from "./cv-types";

export type { GeneratedDocs };

/**
 * Fill Ort and Datum ourselves when the model leaves them out — which it often
 * does, costing the Lebenslauf its signature block and the Anschreiben the date
 * line DIN 5008 requires. Both are facts we already hold, so there is no reason
 * to depend on the model for them.
 *
 * Only ever fills blanks: anything the model genuinely supplied is left alone.
 */
function applyPlaceAndDate(docs: GeneratedDocs): GeneratedDocs {
  // SYSTEM_RULES tells the model to emit "[Datum]" style placeholders for
  // unknown fields, so a missing date arrives as a non-empty string. For Ort and
  // Datum we know the real answer, so treat a placeholder as absent.
  const real = (v?: string) =>
    v && !/^\[[^\]]*\]$/.test(v.trim()) ? v : undefined;

  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // "Musterstraße 12, 10115 Berlin" -> "Berlin"; also handles a bare "10115
  // Berlin" and an address with no postal code at all.
  const address = real(docs.lebenslauf.persoenlicheDaten.adresse) ?? "";
  const lastPart = address.split(",").pop()?.trim() ?? "";
  const city = lastPart.replace(/^\d{4,5}\s+/, "").trim();

  const ort = city || undefined;

  return {
    lebenslauf: {
      ...docs.lebenslauf,
      ort: real(docs.lebenslauf.ort) ?? ort,
      datum: real(docs.lebenslauf.datum) ?? today,
    },
    anschreiben: {
      ...docs.anschreiben,
      ort: real(docs.anschreiben.ort) ?? ort,
      datum: real(docs.anschreiben.datum) ?? today,
    },
  };
}

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
- Betreffzeile OHNE das Wort "Betreff:". Nennt die konkrete Ausbildungsstelle.
- Anrede: "Sehr geehrte Frau [Name]," / "Sehr geehrter Herr [Name]," oder "Sehr geehrte Damen und Herren," wenn kein Name.
- 3–4 prägnante Absätze: (1) Motivation & Bezug zur Stelle, (2) schulische Stärken & relevante Erfahrung, (3) warum genau DIESE Firma, (4) Schlusssatz mit Gesprächswunsch.
- Abschluss: "Mit freundlichen Grüßen", dann Name.
- Formell, motiviert, authentisch — deutsche Personaler legen bei Azubis großen Wert auf Motivation. Keine Floskeln, keine Übertreibung.

Das Layout (Seitenränder, Blocksatz, rechtsbündiges Datum, fette Betreffzeile) wird
NICHT von dir erzeugt — du lieferst nur die strukturierten Inhalte. Schreibe daher
keine Sternchen, Bindestrich-Linien oder sonstige Textformatierung in die Felder.

Schreibe fehlerfrei auf Deutsch. Erfinde KEINE Fakten, die nicht in den Angaben stehen. Wenn Angaben fehlen, lasse den Platzhalter in eckigen Klammern, z. B. [Adresse].`;

// The output contract. Prose is unusable downstream — it cannot be laid out to
// DIN 5008, edited field-by-field, or exported — so the model fills a schema
// instead and all formatting happens in the renderer.
const SCHEMA_RULES = `Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in exakt dieser Struktur.
Keine Markdown-Codeblöcke, kein Text davor oder danach.

{
  "lebenslauf": {
    "persoenlicheDaten": {
      "name": "Max Mustermann",
      "adresse": "Musterstraße 1, 10115 Berlin",
      "telefon": "+49 170 1234567",
      "email": "max@example.com",
      "geburtsdatum": "15.03.2007",
      "geburtsort": "Tunis",
      "staatsangehoerigkeit": "tunesisch"
    },
    "abschnitte": [
      {
        "titel": "Schulbildung",
        "eintraege": [
          {
            "von": "09/2023",
            "bis": "07/2026",
            "titel": "Allgemeine Hochschulreife (Note 2,1)",
            "organisation": "Goethe-Gymnasium",
            "ort": "Berlin",
            "details": ["Leistungskurse: Mathematik, Englisch"]
          }
        ]
      }
    ],
    "ort": "Berlin",
    "datum": "24.07.2026"
  },
  "anschreiben": {
    "absender": { "name": "Max Mustermann", "zeilen": ["Musterstraße 1", "10115 Berlin", "+49 170 1234567"] },
    "empfaenger": { "zeilen": ["Lidl Dienstleistung GmbH", "Frau Müller", "Musterallee 5", "10117 Berlin"] },
    "ort": "Berlin",
    "datum": "24.07.2026",
    "betreff": "Bewerbung um einen Ausbildungsplatz als Kaufmann im Einzelhandel ab September 2027",
    "anrede": "Sehr geehrte Frau Müller,",
    "absaetze": ["Absatz 1 ...", "Absatz 2 ...", "Absatz 3 ..."],
    "gruss": "Mit freundlichen Grüßen",
    "unterschrift": "Max Mustermann"
  }
}

WICHTIG:
- "abschnitte" ist ein Array von Objekten, niemals ein String.
- "details" und "absaetze" sind immer Arrays von Strings (leeres Array wenn nichts).
- Für "Kenntnisse", "Sprachen" und "Hobbys": ein Eintrag pro Punkt, jeweils mit "titel" (z. B. "Deutsch") und optional "details" (z. B. ["Niveau B2"]). "von"/"bis" bleiben dort leer.
- Lasse ein Feld weg oder setze es auf "", wenn keine Angabe vorliegt — erfinde nichts.`;

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

${SCHEMA_RULES}`;
}

export async function generateGermanDocs(
  c: CandidateInput,
  signal?: AbortSignal,
): Promise<GeneratedDocs> {
  return callModels(
    [
      { role: "system", content: SYSTEM_RULES },
      { role: "user", content: buildUserPrompt(c) },
    ],
    signal,
  );
}

// Reformat an existing CV/cover letter (any language/format) into proper German
// Ausbildung documents. Optionally target a specific Ausbildung/company.
export async function reformatToGerman(
  existingText: string,
  target?: { ausbildungTitle?: string; company?: string; contactPerson?: string },
  signal?: AbortSignal,
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

${SCHEMA_RULES}`;

  return callModels(
    [
      { role: "system", content: SYSTEM_RULES },
      { role: "user", content: prompt },
    ],
    signal,
  );
}

// A single free model gets this long before we give up and try the next one.
// Free-tier models occasionally hang open indefinitely; without this the whole
// request rides until the platform kills it and the user just sees a 504.
//
// Sizing measured against the live free tier with a full structured-CV prompt:
// response headers land in 1–3s but the body takes 37s (nemotron-3-super) to
// 68s (gpt-oss-20b), because the model is still generating while OpenRouter
// holds the connection open with whitespace padding. An earlier 25s ceiling
// aborted every real generation mid-body. Keep this above ~70s.
const PER_MODEL_TIMEOUT_MS = 75_000;
// Total wall-clock budget for the fallback chain. Must stay comfortably under
// the route's `maxDuration` so we can still return a real error message.
const TOTAL_BUDGET_MS = 150_000;
const DEFAULT_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Shared OpenRouter caller: tries free models in order, falls through on
// rate-limit/timeout/error, parses the JSON {lebenslauf, anschreiben} response.
// `signal` is the caller's request signal — if the browser disconnects we stop
// burning quota on a response nobody will read.
async function callModels(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<GeneratedDocs> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");

  // Read per call, not at module scope: an override set after import (tests, or
  // a self-hosted OpenAI-compatible gateway) must still take effect.
  const apiUrl = process.env.OPENROUTER_BASE_URL ?? DEFAULT_API_URL;

  const models = (process.env.OPENROUTER_MODELS ??
    "nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free,openai/gpt-oss-20b:free")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastErr = "";

  for (const model of models) {
    // Never start an attempt we have no time to finish.
    const remaining = deadline - Date.now();
    if (remaining < 5_000) {
      lastErr = lastErr || "time budget exhausted";
      break;
    }

    const timeout = AbortSignal.timeout(Math.min(PER_MODEL_TIMEOUT_MS, remaining));
    const attemptSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let res: Response;
    try {
      res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          // Structured JSON carries far more overhead than the prose it
          // replaced; 4096 truncated mid-object and lost the whole response.
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
        signal: attemptSignal,
      });
    } catch (e) {
      // The caller going away is fatal — don't fall through to the next model.
      if (signal?.aborted) throw new Error("client disconnected");
      lastErr =
        e instanceof Error && e.name === "TimeoutError"
          ? `${model} timed out`
          : `${model} network error: ${e instanceof Error ? e.message : String(e)}`;
      continue;
    }

    if (res.status === 429) {
      lastErr = `${model} rate-limited`;
      continue; // try next free model
    }
    if (!res.ok) {
      lastErr = `${model} error ${res.status}: ${(await res.text()).slice(0, 200)}`;
      continue;
    }

    // The body is read under the same signal as the request: OpenRouter returns
    // headers almost immediately and then holds the connection open — padding it
    // with whitespace — while the model generates. So the real wait happens
    // here, and an abort during this read is a timeout, not a parse failure.
    let text: string | undefined;
    try {
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content;
    } catch (e) {
      if (signal?.aborted) throw new Error("client disconnected");
      const timedOut =
        e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      lastErr = timedOut
        ? `${model} timed out while streaming the response`
        : `${model} response body was not JSON`;
      continue;
    }
    if (!text) {
      lastErr = `${model} returned no content`;
      continue;
    }

    // Some models wrap JSON in ```json fences — strip them defensively.
    let s = text.trim();
    if (s.startsWith("```")) {
      s = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
    }

    let raw: unknown;
    try {
      raw = JSON.parse(s);
    } catch {
      lastErr = `${model} returned malformed JSON`;
      continue;
    }

    try {
      // Coerces the ragged shapes free models produce; throws only when the
      // result is too thin to show, in which case the next model gets a turn.
      return applyPlaceAndDate(normalizeDocs(raw));
    } catch (e) {
      lastErr =
        e instanceof ShapeError
          ? `${model} bad shape: ${e.message}`
          : `${model} normalization failed`;
    }
  }

  throw new Error(`All models failed. Last: ${lastErr}`);
}
