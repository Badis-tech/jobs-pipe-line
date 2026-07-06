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
