# jobs-pipe-line

Supabase-native jobs ETL with a Next.js frontend.

- **Pipeline** — the `ingest-jobs` Edge Function (`supabase/functions/ingest-jobs/`) pulls from Remotive, Arbeitnow, BA Jobsuche, Jobicy and The Muse (plus Adzuna, Jooble and USAJOBS once their API keys are set — see [SEARCH_APIS_SETUP.md](SEARCH_APIS_SETUP.md)) into a `raw_jobs` staging table and a normalized `jobs` table, with per-run logging in `pipeline_runs`. Scheduled every 6 hours via pg_cron; do not tighten the schedule (Remotive's terms ask for ~4 calls/day).
- **Web** — read-only Next.js app in `web/`, live at [jobs-pipe-line.vercel.app](https://jobs-pipe-line.vercel.app). Pushes to `main` deploy automatically via the Vercel git integration (project root directory: `web`).
- **Setup & deployment** — see [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md).

Job data is credited to and links back to its original source (Remotive, Jobicy, etc. require this).
