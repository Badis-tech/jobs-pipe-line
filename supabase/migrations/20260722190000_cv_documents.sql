-- Saved CV / cover-letter generations, one row per generated document set.
-- Tied to the authenticated user who created it. RLS: users read/write only
-- their own rows. (Tool is admin-only for now, but the model is per-user so it
-- scales to self-serve later without a schema change.)

create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Short human label, e.g. "Youssef — Mechatroniker".
  title text not null default 'Ohne Titel',
  -- 'form' = generated from the form; 'reformat' = from an existing CV.
  mode text not null default 'form' check (mode in ('form','reformat')),
  -- The raw input we sent (candidate fields as JSON, or pasted CV text).
  input jsonb,
  -- The two generated documents.
  lebenslauf text not null,
  anschreiben text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cv_documents_user_created_idx
  on public.cv_documents (user_id, created_at desc);

alter table public.cv_documents enable row level security;

-- Each user sees and manages only their own documents.
create policy "read own cv documents"
  on public.cv_documents for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "insert own cv documents"
  on public.cv_documents for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "update own cv documents"
  on public.cv_documents for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "delete own cv documents"
  on public.cv_documents for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- keep updated_at honest (reuse the existing touch function if present)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cv_documents_touch_updated_at
  before update on public.cv_documents
  for each row execute function public.touch_updated_at();
