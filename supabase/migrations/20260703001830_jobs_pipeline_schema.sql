-- Jobs pipeline schema: raw staging, clean dataset, run log.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Staging: exact API payloads, one row per (source, external job id).
-- Kept so the clean table can be rebuilt without re-fetching.
create table public.raw_jobs (
  id bigint generated always as identity primary key,
  source text not null,
  external_id text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  unique (source, external_id)
);

-- Clean, normalized dataset.
create table public.jobs (
  id bigint generated always as identity primary key,
  source text not null,
  external_id text not null,
  title text not null,
  company text,
  location text,
  remote boolean,
  job_type text,
  category text,
  tags text[] not null default '{}',
  salary_text text,
  url text not null,
  description_html text,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source, external_id)
);

create index jobs_published_at_idx on public.jobs (published_at desc);
create index jobs_company_idx on public.jobs (company);
create index jobs_tags_idx on public.jobs using gin (tags);

-- One row per ingestion run per source, for observability.
create table public.pipeline_runs (
  id bigint generated always as identity primary key,
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  jobs_fetched integer,
  jobs_upserted integer,
  error text
);

alter table public.raw_jobs enable row level security;
alter table public.jobs enable row level security;
alter table public.pipeline_runs enable row level security;

-- The clean dataset is publicly readable; staging and run logs are
-- service-role only (no policies).
create policy "jobs are publicly readable"
  on public.jobs for select
  to anon, authenticated
  using (true);
