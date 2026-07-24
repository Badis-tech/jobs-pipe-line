// Render the structured documents back to plain text.
//
// Two consumers: the `lebenslauf`/`anschreiben` text columns (kept populated so
// pre-structured history rows and the copy-to-clipboard button keep working),
// and anywhere a paste-into-email version is wanted.

import type { Anschreiben, Lebenslauf, GeneratedDocs } from "./cv-types";

function dateRange(von?: string, bis?: string): string {
  if (von && bis) return `${von} – ${bis}`;
  return von ?? bis ?? "";
}

export function lebenslaufToText(cv: Lebenslauf): string {
  const out: string[] = ["LEBENSLAUF", ""];
  const p = cv.persoenlicheDaten;

  out.push("PERSÖNLICHE DATEN");
  const personal: [string, string | undefined][] = [
    ["Name", p.name],
    ["Adresse", p.adresse],
    ["Telefon", p.telefon],
    ["E-Mail", p.email],
    ["Geburtsdatum", p.geburtsdatum],
    ["Geburtsort", p.geburtsort],
    ["Staatsangehörigkeit", p.staatsangehoerigkeit],
  ];
  for (const [label, value] of personal) {
    if (value) out.push(`${label.padEnd(22)}${value}`);
  }

  for (const section of cv.abschnitte) {
    out.push("", section.titel.toUpperCase());
    for (const e of section.eintraege) {
      const range = dateRange(e.von, e.bis);
      const head = [e.titel, e.organisation].filter(Boolean).join(", ");
      out.push(`${range.padEnd(22)}${head}${e.ort ? `, ${e.ort}` : ""}`);
      for (const d of e.details) out.push(`${" ".repeat(22)}• ${d}`);
    }
  }

  if (cv.ort || cv.datum) {
    out.push("", [cv.ort, cv.datum].filter(Boolean).join(", "));
    out.push("", p.name);
  }
  return out.join("\n");
}

export function anschreibenToText(a: Anschreiben): string {
  const out: string[] = [];
  if (a.absender.name) out.push(a.absender.name);
  out.push(...a.absender.zeilen);
  out.push("");
  out.push(...a.empfaenger.zeilen);
  out.push("");
  if (a.ort || a.datum) out.push([a.ort, a.datum].filter(Boolean).join(", "), "");
  if (a.betreff) out.push(a.betreff, "");
  out.push(a.anrede, "");
  for (const p of a.absaetze) out.push(p, "");
  out.push(a.gruss, "", a.unterschrift);
  return out.join("\n");
}

export function docsToText(docs: GeneratedDocs): {
  lebenslauf: string;
  anschreiben: string;
} {
  return {
    lebenslauf: lebenslaufToText(docs.lebenslauf),
    anschreiben: anschreibenToText(docs.anschreiben),
  };
}
