-- Store the structured form of each generated document set.
--
-- The engine now returns a schema (personal data, dated sections, letter
-- paragraphs) rather than prose, because prose cannot be laid out to DIN 5008
-- or exported to PDF. The existing lebenslauf/anschreiben text columns stay and
-- stay populated — they hold the rendered plain-text version, which keeps the
-- copy-to-clipboard path and every pre-existing row working unchanged.
--
-- Nullable by design: rows created before this migration have no structured
-- form, and the app falls back to the text columns for them.

alter table public.cv_documents
  add column if not exists lebenslauf_json jsonb,
  add column if not exists anschreiben_json jsonb;

comment on column public.cv_documents.lebenslauf_json is
  'Structured Lebenslauf (see web/lib/cv-types.ts). Null for rows predating structured output.';
comment on column public.cv_documents.anschreiben_json is
  'Structured Anschreiben (see web/lib/cv-types.ts). Null for rows predating structured output.';
