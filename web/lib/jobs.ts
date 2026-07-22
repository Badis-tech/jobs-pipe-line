import { createSupabase } from "./supabase";
import type { Tables } from "./database.types";

export type Job = Tables<"jobs">;

export type JobListItem = Pick<
  Job,
  | "id"
  | "title"
  | "company"
  | "location"
  | "source"
  | "job_type"
  | "category"
  | "tags"
  | "salary_text"
  | "published_at"
  | "remote"
>;

export const PAGE_SIZE = 10;

// Free tier: pages 1 and 2 (20 Ausbildung listings). Page 3+ requires an
// active €4.99/mo subscription. Enforced server-side in the page component.
export const FREE_PAGES = 2;

// Sources currently ingesting; adzuna/jooble/usajobs join once their API
// keys are configured in the Edge Function secrets.
export const SOURCES = ["remotive", "arbeitnow", "jobsuche", "jobicy", "themuse"] as const;

// job_type values worth a dedicated filter. Other sources store their own
// strings (e.g. "full_time"); extend here as filters grow.
export const JOB_TYPES = [
  { value: "AUSBILDUNG", label: "Ausbildung" },
  { value: "ARBEIT", label: "Arbeit" },
  { value: "PRAKTIKUM_TRAINEE", label: "Praktikum / Trainee" },
] as const;

export interface JobFilters {
  q?: string;
  source?: string;
  type?: string;
  page?: number;
}

export async function fetchJobs({ q, source, type, page = 1 }: JobFilters) {
  const supabase = createSupabase();
  let query = supabase
    .from("jobs")
    .select(
      "id, title, company, location, source, job_type, category, tags, salary_text, published_at, remote",
      { count: "exact" },
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });

  if (q) {
    // Commas and parens are PostgREST or() syntax; drop them from user input.
    const term = q.replace(/[,()]/g, " ").trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%`);
    }
  }
  if (source) query = query.eq("source", source);
  if (type) query = query.eq("job_type", type);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`fetchJobs: ${error.message}`);

  return {
    jobs: (data ?? []) as JobListItem[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function fetchJob(id: number): Promise<Job | null> {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`fetchJob: ${error.message}`);
  return data;
}
