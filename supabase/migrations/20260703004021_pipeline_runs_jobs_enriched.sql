-- Count of per-job detail fetches (description enrichment) per run.
alter table public.pipeline_runs add column jobs_enriched integer;
