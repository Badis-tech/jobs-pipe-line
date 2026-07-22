export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const SOURCE_LABELS: Record<string, string> = {
  remotive: "Remotive",
  arbeitnow: "Arbeitnow",
  jobsuche: "Jobsuche (BA)",
  jobicy: "Jobicy",
  themuse: "The Muse",
  adzuna: "Adzuna",
  jooble: "Jooble",
  usajobs: "USAJOBS",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

const TYPE_LABELS: Record<string, string> = {
  AUSBILDUNG: "Ausbildung",
  ARBEIT: "Arbeit",
  PRAKTIKUM_TRAINEE: "Praktikum / Trainee",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

export function typeLabel(jobType: string | null): string | null {
  if (!jobType) return null;
  return TYPE_LABELS[jobType] ?? jobType;
}

// Job-board locations arrive noisy: "Berlin, BERLIN, DEUTSCHLAND",
// "Bad Saulgau, BADEN_WUERTTEMBERG, DEUTSCHLAND". We dedupe segments,
// title-case SCREAMING or snake_case tokens, and drop the country.
const COUNTRY_TOKENS = new Set([
  "deutschland",
  "germany",
  "de",
  "österreich",
  "osterreich",
  "austria",
  "schweiz",
  "switzerland",
]);

function titleCaseToken(token: string): string {
  return token
    .replace(/_/g, " ")
    .toLowerCase()
    // Restore German umlauts that sources ASCII-fold (ue/oe/ae after a vowelless
    // consonant cluster is risky, so only fix well-known region spellings).
    .replace(/wuerttemberg/g, "württemberg")
    .replace(/thueringen/g, "thüringen")
    .replace(/muenchen/g, "münchen")
    .replace(/koeln/g, "köln")
    .replace(/nuernberg/g, "nürnberg")
    .replace(/duesseldorf/g, "düsseldorf")
    .replace(/osnabrueck/g, "osnabrück")
    .replace(/saarbruecken/g, "saarbrücken")
    .split(/(\s|-)/)
    .map((part) => (part.trim() ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("");
}

export function formatLocation(location: string | null): string | null {
  if (!location) return null;
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const rawSeg of location.split(",")) {
    const seg = rawSeg.trim();
    if (!seg) continue;
    if (COUNTRY_TOKENS.has(seg.toLowerCase())) continue;
    const pretty = /[A-ZÄÖÜ]{3,}|_/.test(seg) ? titleCaseToken(seg) : seg;
    const key = pretty.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(pretty);
  }
  return parts.join(", ") || null;
}

// Some sources dump enum codes into salary_text (e.g.
// "AUSBILDUNGSVERGUETUNG_NACH_JAHREN"). Only show human-readable salaries:
// something with a digit or a currency symbol.
export function formatSalary(salary: string | null): string | null {
  if (!salary) return null;
  const s = salary.trim();
  if (!s) return null;
  if (/_/.test(s) && !/\d/.test(s)) return null; // pure enum
  if (!/[\d€$£]/.test(s)) return null; // no number/currency → probably junk
  return s;
}
