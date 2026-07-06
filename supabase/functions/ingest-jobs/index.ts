import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface NormalizedJob {
  source: string;
  external_id: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean | null;
  job_type: string | null;
  category: string | null;
  tags: string[];
  salary_text: string | null;
  url: string;
  description_html: string | null;
  published_at: string | null;
  last_seen_at: string;
}

interface Source {
  name: string;
  // Env vars that must be set for this source; missing ones skip the source
  // (reported in the response, no pipeline_runs row).
  requiredEnv?: string[];
  fetch: () => Promise<{ raw: { external_id: string; payload: unknown }[]; jobs: NormalizedJob[] }>;
  // Optional post-upsert step (e.g. per-job detail calls); returns count processed.
  enrich?: () => Promise<number>;
}

function env(name: string): string | null {
  const v = Deno.env.get(name)?.trim();
  return v ? v : null;
}

function salaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency?: string | null,
  period?: string | null,
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  const range = min && max && min !== max ? `${fmt(min)}–${fmt(max)}` : fmt((min || max)!);
  return [range, currency, period].filter(Boolean).join(" ");
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

// Remotive timestamps and Jobsuche dates come without a timezone; they are UTC.
function toUtcIso(s: string | null | undefined): string | null {
  if (!s) return null;
  let normalized = s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    normalized = s + "T00:00:00Z";
  } else if (!/Z$|[+-]\d{2}:?\d{2}$/.test(s)) {
    normalized = s + "Z";
  }
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const remotive: Source = {
  name: "remotive",
  async fetch() {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=200");
    if (!res.ok) throw new Error(`remotive HTTP ${res.status}`);
    const body = await res.json();
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (const j of body.jobs ?? []) {
      if (!j.id || !j.title || !j.url) continue;
      const external_id = String(j.id);
      raw.push({ external_id, payload: j });
      jobs.push({
        source: "remotive",
        external_id,
        title: j.title,
        company: j.company_name ?? null,
        location: j.candidate_required_location ?? null,
        remote: true,
        job_type: j.job_type ?? null,
        category: j.category ?? null,
        tags: Array.isArray(j.tags) ? j.tags : [],
        salary_text: j.salary || null,
        url: j.url,
        description_html: j.description ?? null,
        published_at: toUtcIso(j.publication_date),
        last_seen_at: now,
      });
    }
    return { raw, jobs };
  },
};

const arbeitnow: Source = {
  name: "arbeitnow",
  async fetch() {
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
      if (!res.ok) throw new Error(`arbeitnow HTTP ${res.status} (page ${page})`);
      const body = await res.json();
      const items = body.data ?? [];
      for (const j of items) {
        if (!j.slug || !j.title || !j.url) continue;
        raw.push({ external_id: j.slug, payload: j });
        jobs.push({
          source: "arbeitnow",
          external_id: j.slug,
          title: j.title,
          company: j.company_name ?? null,
          location: j.location || null,
          remote: typeof j.remote === "boolean" ? j.remote : null,
          job_type: Array.isArray(j.job_types) && j.job_types.length ? j.job_types.join(", ") : null,
          category: null,
          tags: Array.isArray(j.tags) ? j.tags : [],
          salary_text: null,
          url: j.url,
          description_html: j.description ?? null,
          published_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
          last_seen_at: now,
        });
      }
      if (items.length === 0 || !body.links?.next) break;
    }
    return { raw, jobs };
  },
};

// Bundesagentur für Arbeit Jobsuche API. "jobboerse-jobsuche" is the public
// client id documented at https://jobsuche.api.bund.dev/ — not a secret.
const JOBSUCHE_BASE = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc";
const JOBSUCHE_HEADERS = { "X-API-Key": "jobboerse-jobsuche" };
// Detail fetches per run; the backlog drains across scheduled runs. Each run
// adds ~350 new jobs, so this must stay comfortably above that or the backlog
// grows without bound. ~500 detail calls at concurrency 8 takes ~20s, well
// inside the cron's 120s timeout.
const JOBSUCHE_ENRICH_LIMIT = 500;

const jobsuche: Source = {
  name: "jobsuche",
  async fetch() {
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    const seen = new Set<string>();
    // angebotsart 1 = ARBEIT, 4 = AUSBILDUNG / duales Studium. job_type keeps
    // the stellenangebotsart value so either kind can be filtered in SQL.
    for (const angebotsart of ["1", "4"]) {
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `${JOBSUCHE_BASE}/v6/jobs?size=100&page=${page}&angebotsart=${angebotsart}`,
          { headers: JOBSUCHE_HEADERS },
        );
        if (!res.ok) throw new Error(`jobsuche HTTP ${res.status} (angebotsart ${angebotsart}, page ${page})`);
        const body = await res.json();
        const items = body.ergebnisliste ?? [];
        for (const j of items) {
          if (!j.referenznummer || !j.stellenangebotsTitel || seen.has(j.referenznummer)) continue;
          seen.add(j.referenznummer);
          raw.push({ external_id: j.referenznummer, payload: j });
          const address = j.stellenlokationen?.[0]?.adresse;
          const location = address
            ? [address.ort, address.region, address.land].filter(Boolean).join(", ")
            : null;
          jobs.push({
            source: "jobsuche",
            external_id: j.referenznummer,
            title: j.stellenangebotsTitel,
            company: j.firma ?? null,
            location,
            remote: null,
            job_type: j.stellenangebotsart ?? null,
            category: j.hauptberuf ?? null,
            tags: Array.isArray(j.alleBerufe) ? j.alleBerufe : [],
            salary_text:
              j.verguetungsangabe && j.verguetungsangabe !== "KEINE_ANGABEN"
                ? j.verguetungsangabe
                : null,
            url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(j.referenznummer)}`,
            description_html: null,
            published_at: toUtcIso(j.datumErsteVeroeffentlichung ?? j.veroeffentlichungszeitraum?.von),
            last_seen_at: now,
          });
        }
        if (items.length === 0) break;
      }
    }
    return { raw, jobs };
  },

  // Fill description_html from the v3 jobdetails endpoint for jobs that
  // don't have one yet, newest first. Delisted jobs (403/404) get '' so
  // they are not retried forever; transient failures stay null for retry.
  async enrich() {
    const { data: pending, error } = await supabase
      .from("jobs")
      .select("id, external_id")
      .eq("source", "jobsuche")
      .is("description_html", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(JOBSUCHE_ENRICH_LIMIT);
    if (error) throw new Error(`jobs select for enrich: ${error.message}`);
    if (!pending || pending.length === 0) return 0;

    const outcomes = await mapConcurrent(pending, 8, async (job) => {
      const encoded = encodeURIComponent(btoa(job.external_id));
      let description: string | null = null;
      try {
        const res = await fetch(`${JOBSUCHE_BASE}/v3/jobdetails/${encoded}`, {
          headers: JOBSUCHE_HEADERS,
        });
        if (res.ok) {
          const detail = await res.json();
          description = detail.stellenangebotsBeschreibung ?? "";
        } else if (res.status === 403 || res.status === 404) {
          description = "";
        }
      } catch (_err) {
        // network error: leave null, retried next run
      }
      if (description === null) return 0;
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ description_html: description })
        .eq("id", job.id);
      return updateError ? 0 : 1;
    });
    return outcomes.reduce((sum: number, n) => sum + n, 0);
  },
};

// Jobicy remote jobs feed (keyless). Their terms ask that Jobicy is credited
// and apply buttons link to the original job URL — we store their url as-is.
const jobicy: Source = {
  name: "jobicy",
  async fetch() {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=100");
    if (!res.ok) throw new Error(`jobicy HTTP ${res.status}`);
    const body = await res.json();
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (const j of body.jobs ?? []) {
      if (!j.id || !j.jobTitle || !j.url) continue;
      const external_id = String(j.id);
      raw.push({ external_id, payload: j });
      jobs.push({
        source: "jobicy",
        external_id,
        title: j.jobTitle,
        company: j.companyName ?? null,
        location: j.jobGeo || null,
        remote: true,
        job_type: Array.isArray(j.jobType) && j.jobType.length ? j.jobType.join(", ") : null,
        category: Array.isArray(j.jobIndustry) && j.jobIndustry.length ? j.jobIndustry[0] : null,
        tags: Array.isArray(j.jobIndustry) ? j.jobIndustry : [],
        salary_text: salaryRange(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod),
        url: j.url,
        description_html: j.jobDescription ?? null,
        published_at: toUtcIso(j.pubDate),
        last_seen_at: now,
      });
    }
    return { raw, jobs };
  },
};

// The Muse public API (keyless; optional THEMUSE_API_KEY raises the rate
// limit to 3600 req/h). 20 jobs per page.
const themuse: Source = {
  name: "themuse",
  async fetch() {
    const key = env("THEMUSE_API_KEY");
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (let page = 1; page <= 5; page++) {
      const url = new URL("https://www.themuse.com/api/public/jobs");
      url.searchParams.set("page", String(page));
      if (key) url.searchParams.set("api_key", key);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`themuse HTTP ${res.status} (page ${page})`);
      const body = await res.json();
      const items = body.results ?? [];
      for (const j of items) {
        if (!j.id || !j.name || !j.refs?.landing_page) continue;
        const external_id = String(j.id);
        raw.push({ external_id, payload: j });
        const locations: string[] = (j.locations ?? []).map((l: { name: string }) => l.name);
        jobs.push({
          source: "themuse",
          external_id,
          title: j.name,
          company: j.company?.name ?? null,
          location: locations.length ? locations.join("; ") : null,
          remote: locations.length
            ? locations.some((l) => /remote|flexible/i.test(l))
            : null,
          job_type: j.levels?.[0]?.name ?? null,
          category: j.categories?.[0]?.name ?? null,
          tags: (j.tags ?? []).map((t: { name: string }) => t.name),
          salary_text: null,
          url: j.refs.landing_page,
          description_html: j.contents ?? null,
          published_at: toUtcIso(j.publication_date),
          last_seen_at: now,
        });
      }
      if (items.length === 0) break;
    }
    return { raw, jobs };
  },
};

// Adzuna aggregator (https://developer.adzuna.com/). Free tier: 25 req/min,
// 250 req/day — country list × 2 pages × 4 runs/day stays well inside that.
const adzuna: Source = {
  name: "adzuna",
  requiredEnv: ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"],
  async fetch() {
    const appId = env("ADZUNA_APP_ID")!;
    const appKey = env("ADZUNA_APP_KEY")!;
    const countries = (env("ADZUNA_COUNTRIES") ?? "de,gb,us").split(",").map((c) => c.trim());
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (const cc of countries) {
      for (let page = 1; page <= 2; page++) {
        const res = await fetch(
          `https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=50&sort_by=date`,
        );
        if (!res.ok) throw new Error(`adzuna HTTP ${res.status} (${cc}, page ${page})`);
        const body = await res.json();
        const items = body.results ?? [];
        for (const j of items) {
          if (!j.id || !j.title || !j.redirect_url) continue;
          // Prefix with country: Adzuna ids are per-market.
          const external_id = `${cc}:${j.id}`;
          raw.push({ external_id, payload: j });
          jobs.push({
            source: "adzuna",
            external_id,
            title: j.title,
            company: j.company?.display_name ?? null,
            location: j.location?.display_name ?? null,
            remote: null,
            job_type: [j.contract_time, j.contract_type].filter(Boolean).join(", ") || null,
            category: j.category?.label ?? null,
            tags: [],
            salary_text: salaryRange(j.salary_min, j.salary_max, cc.toUpperCase(), "yearly"),
            url: j.redirect_url,
            description_html: j.description ?? null,
            published_at: toUtcIso(j.created),
            last_seen_at: now,
          });
        }
        if (items.length === 0) break;
      }
    }
    return { raw, jobs };
  },
};

// Jooble aggregator (https://jooble.org/api/about). POST with the key in the
// URL path. Search terms are configurable via JOOBLE_KEYWORDS / JOOBLE_LOCATION.
const jooble: Source = {
  name: "jooble",
  requiredEnv: ["JOOBLE_API_KEY"],
  async fetch() {
    const key = env("JOOBLE_API_KEY")!;
    const keywords = env("JOOBLE_KEYWORDS") ?? "";
    const location = env("JOOBLE_LOCATION") ?? "";
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`https://jooble.org/api/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location, page }),
      });
      if (!res.ok) throw new Error(`jooble HTTP ${res.status} (page ${page})`);
      const body = await res.json();
      const items = body.jobs ?? [];
      for (const j of items) {
        if (!j.id || !j.title || !j.link) continue;
        const external_id = String(j.id);
        if (seen.has(external_id)) continue;
        seen.add(external_id);
        raw.push({ external_id, payload: j });
        jobs.push({
          source: "jooble",
          external_id,
          title: j.title,
          company: j.company || null,
          location: j.location || null,
          remote: null,
          job_type: j.type || null,
          category: null,
          tags: [],
          salary_text: j.salary || null,
          url: j.link,
          description_html: j.snippet ?? null,
          published_at: toUtcIso(j.updated),
          last_seen_at: now,
        });
      }
      if (items.length === 0) break;
    }
    return { raw, jobs };
  },
};

// USAJOBS federal jobs (https://developer.usajobs.gov/). The User-Agent must
// be the email address the key was registered with.
const usajobs: Source = {
  name: "usajobs",
  requiredEnv: ["USAJOBS_API_KEY", "USAJOBS_EMAIL"],
  async fetch() {
    const res = await fetch(
      "https://data.usajobs.gov/api/search?ResultsPerPage=250&SortField=DatePosted&SortDirection=Desc",
      {
        headers: {
          "Authorization-Key": env("USAJOBS_API_KEY")!,
          "User-Agent": env("USAJOBS_EMAIL")!,
        },
      },
    );
    if (!res.ok) throw new Error(`usajobs HTTP ${res.status}`);
    const body = await res.json();
    const now = new Date().toISOString();
    const raw = [];
    const jobs: NormalizedJob[] = [];
    for (const item of body.SearchResult?.SearchResultItems ?? []) {
      const d = item.MatchedObjectDescriptor;
      if (!item.MatchedObjectId || !d?.PositionTitle || !d?.PositionURI) continue;
      const external_id = String(item.MatchedObjectId);
      raw.push({ external_id, payload: item });
      const pay = d.PositionRemuneration?.[0];
      jobs.push({
        source: "usajobs",
        external_id,
        title: d.PositionTitle,
        company: d.OrganizationName ?? null,
        location: d.PositionLocationDisplay ?? null,
        remote: d.UserArea?.Details?.RemoteIndicator ?? null,
        job_type: d.PositionSchedule?.[0]?.Name ?? null,
        category: d.JobCategory?.[0]?.Name ?? null,
        tags: [],
        salary_text: pay
          ? salaryRange(Number(pay.MinimumRange), Number(pay.MaximumRange), "USD", pay.RateIntervalCode)
          : null,
        url: d.PositionURI,
        description_html: d.UserArea?.Details?.JobSummary ?? null,
        published_at: toUtcIso(d.PublicationStartDate),
        last_seen_at: now,
      });
    }
    return { raw, jobs };
  },
};

const SOURCES: Source[] = [remotive, arbeitnow, jobsuche, jobicy, themuse, adzuna, jooble, usajobs];

// A job can appear on two pages of the same fetch (listings shift between
// page requests); duplicate keys in one upsert batch make Postgres error with
// "cannot affect row a second time", so keep only the last occurrence.
function dedupeByExternalId<T extends { external_id: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of rows) byId.set(row.external_id, row);
  return [...byId.values()];
}

async function upsertChunked(table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase
      .from(table)
      .upsert(rows.slice(i, i + 100), { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
}

async function runSource(source: Source) {
  const { data: run, error: runError } = await supabase
    .from("pipeline_runs")
    .insert({ source: source.name })
    .select("id")
    .single();
  if (runError) throw new Error(`pipeline_runs insert: ${runError.message}`);

  try {
    const fetched = await source.fetch();
    const raw = dedupeByExternalId(fetched.raw);
    const jobs = dedupeByExternalId(fetched.jobs);
    const fetchedAt = new Date().toISOString();
    await upsertChunked(
      "raw_jobs",
      raw.map((r) => ({ source: source.name, fetched_at: fetchedAt, ...r })),
      "source,external_id",
    );
    await upsertChunked("jobs", jobs, "source,external_id");
    const enriched = source.enrich ? await source.enrich() : null;
    await supabase
      .from("pipeline_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        jobs_fetched: raw.length,
        jobs_upserted: jobs.length,
        jobs_enriched: enriched,
      })
      .eq("id", run.id);
    return {
      source: source.name,
      status: "success",
      jobs_fetched: raw.length,
      jobs_upserted: jobs.length,
      jobs_enriched: enriched,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("pipeline_runs")
      .update({ status: "error", finished_at: new Date().toISOString(), error: message })
      .eq("id", run.id);
    return { source: source.name, status: "error", error: message };
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const only = url.searchParams.get("source");
  const sources = only ? SOURCES.filter((s) => s.name === only) : SOURCES;
  if (sources.length === 0) {
    return new Response(JSON.stringify({ error: `unknown source: ${only}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = [];
  for (const source of sources) {
    const missing = (source.requiredEnv ?? []).filter((name) => !env(name));
    if (missing.length > 0) {
      results.push({ source: source.name, status: "skipped", missing_env: missing });
      continue;
    }
    results.push(await runSource(source));
  }
  const ok = results.every((r) => r.status !== "error");
  return new Response(JSON.stringify({ results }, null, 2), {
    status: ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});
