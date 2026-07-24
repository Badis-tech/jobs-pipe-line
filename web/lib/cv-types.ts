// The structured document model. This — not prose — is what the model returns
// and what we persist, because a Lebenslauf that is only a string cannot be laid
// out to DIN 5008, edited field-by-field, or exported to PDF.
//
// Everything here is normalized through `normalizeDocs` before it is trusted:
// free-tier models drop fields, return objects where arrays belong, and
// occasionally invent sections. The renderer must never see a ragged shape.

export interface PersonalData {
  name: string;
  adresse?: string;
  telefon?: string;
  email?: string;
  geburtsdatum?: string;
  geburtsort?: string;
  staatsangehoerigkeit?: string;
}

export interface CvEntry {
  /** e.g. "09/2023" — free-form, the model follows the prompt's date rules. */
  von?: string;
  /** e.g. "07/2026" or "heute". */
  bis?: string;
  /** Headline of the entry: degree, role, or the skill itself. */
  titel: string;
  /** School / employer. */
  organisation?: string;
  ort?: string;
  /** Bullet points beneath the entry. */
  details: string[];
}

export interface CvSection {
  titel: string;
  eintraege: CvEntry[];
}

export interface Lebenslauf {
  persoenlicheDaten: PersonalData;
  abschnitte: CvSection[];
  /** Signature block: "Berlin, 24.07.2026". */
  ort?: string;
  datum?: string;
}

export interface Anschreiben {
  absender: { name: string; zeilen: string[] };
  empfaenger: { zeilen: string[] };
  ort?: string;
  datum?: string;
  /** DIN 5008: bold, and never prefixed with the word "Betreff:". */
  betreff: string;
  anrede: string;
  absaetze: string[];
  gruss: string;
  unterschrift: string;
}

export interface GeneratedDocs {
  lebenslauf: Lebenslauf;
  anschreiben: Anschreiben;
}

// --- normalization -------------------------------------------------------
// Deliberately total: every helper returns a usable value for any input.

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** Optional field: empty string collapses to undefined so `?.` checks work. */
function optStr(v: unknown): string | undefined {
  const s = str(v);
  return s === "" ? undefined : s;
}

/**
 * Coerce to a string array. Models variously return a string, an array of
 * strings, an array of objects, or null where a list belongs — accept all of it
 * and drop anything that cannot be read as text.
 */
function strArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter(Boolean);
  const s = str(v);
  if (!s) return [];
  // A single string standing in for a list: split on newlines only, so that
  // ordinary sentence commas don't get shredded into fragments.
  return s.split("\n").map((x) => x.trim()).filter(Boolean);
}

function normEntry(v: unknown): CvEntry | null {
  if (v === null || typeof v !== "object") {
    // Some models emit a bare string where an entry object belongs.
    const s = str(v);
    return s ? { titel: s, details: [] } : null;
  }
  const o = v as Record<string, unknown>;
  const titel = str(o.titel ?? o.title ?? o.bezeichnung ?? o.name);
  const details = strArray(o.details ?? o.beschreibung ?? o.description);
  const organisation = optStr(o.organisation ?? o.org ?? o.firma ?? o.schule);

  // An entry with no headline but with details still carries information —
  // promote the first detail rather than dropping the whole entry.
  if (!titel && details.length === 0 && !organisation) return null;

  return {
    von: optStr(o.von ?? o.from ?? o.start),
    bis: optStr(o.bis ?? o.to ?? o.ende ?? o.end),
    titel: titel || details.shift() || organisation || "",
    organisation,
    ort: optStr(o.ort ?? o.location),
    details,
  };
}

function normSection(v: unknown): CvSection | null {
  if (v === null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const titel = str(o.titel ?? o.title ?? o.name);
  const rawEntries = o.eintraege ?? o.entries ?? o.items ?? o.inhalte;
  const eintraege = (Array.isArray(rawEntries) ? rawEntries : [rawEntries])
    .map(normEntry)
    .filter((e): e is CvEntry => e !== null);

  if (!titel || eintraege.length === 0) return null;
  return { titel, eintraege };
}

function normPersonal(v: unknown): PersonalData {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    name: str(o.name ?? o.fullName ?? o.vollstaendigerName),
    adresse: optStr(o.adresse ?? o.address),
    telefon: optStr(o.telefon ?? o.phone),
    email: optStr(o.email ?? o.mail),
    geburtsdatum: optStr(o.geburtsdatum ?? o.birthDate),
    geburtsort: optStr(o.geburtsort ?? o.birthPlace),
    staatsangehoerigkeit: optStr(o.staatsangehoerigkeit ?? o.nationality),
  };
}

function normLebenslauf(v: unknown): Lebenslauf {
  const o = (v ?? {}) as Record<string, unknown>;
  const rawSections = o.abschnitte ?? o.sections ?? o.sektionen;
  return {
    persoenlicheDaten: normPersonal(o.persoenlicheDaten ?? o.personalData ?? o.persoenlichesDaten),
    abschnitte: (Array.isArray(rawSections) ? rawSections : [])
      .map(normSection)
      .filter((s): s is CvSection => s !== null),
    ort: optStr(o.ort),
    datum: optStr(o.datum),
  };
}

function normAnschreiben(v: unknown): Anschreiben {
  const o = (v ?? {}) as Record<string, unknown>;
  const abs = (o.absender ?? {}) as Record<string, unknown>;
  const emp = (o.empfaenger ?? o.empfänger ?? {}) as Record<string, unknown>;

  let betreff = str(o.betreff ?? o.subject);
  // DIN 5008 forbids the literal "Betreff:" label; models add it anyway.
  betreff = betreff.replace(/^betreff\s*:\s*/i, "");

  return {
    absender: {
      name: str(abs.name),
      zeilen: strArray(abs.zeilen ?? abs.lines ?? abs.adresse),
    },
    empfaenger: {
      zeilen: strArray(emp.zeilen ?? emp.lines ?? emp.adresse),
    },
    ort: optStr(o.ort),
    datum: optStr(o.datum),
    betreff,
    anrede: str(o.anrede ?? o.salutation) || "Sehr geehrte Damen und Herren,",
    absaetze: strArray(o.absaetze ?? o.absätze ?? o.paragraphs ?? o.text),
    gruss: str(o.gruss ?? o.gruß ?? o.closing) || "Mit freundlichen Grüßen",
    unterschrift: str(o.unterschrift ?? o.signature ?? abs.name),
  };
}

export class ShapeError extends Error {}

/**
 * Validate and coerce raw model JSON into `GeneratedDocs`. Throws only when the
 * result carries too little to be worth showing — the caller treats that as a
 * failed attempt and falls through to the next model.
 */
export function normalizeDocs(raw: unknown): GeneratedDocs {
  if (raw === null || typeof raw !== "object") {
    throw new ShapeError("response was not an object");
  }
  const o = raw as Record<string, unknown>;
  const lebenslauf = normLebenslauf(o.lebenslauf);
  const anschreiben = normAnschreiben(o.anschreiben);

  if (!lebenslauf.persoenlicheDaten.name) {
    throw new ShapeError("Lebenslauf is missing the applicant name");
  }
  if (lebenslauf.abschnitte.length === 0) {
    throw new ShapeError("Lebenslauf has no usable sections");
  }
  if (anschreiben.absaetze.length === 0) {
    throw new ShapeError("Anschreiben has no body paragraphs");
  }
  return { lebenslauf, anschreiben };
}
