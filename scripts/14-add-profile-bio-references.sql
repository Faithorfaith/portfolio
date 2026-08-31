-- Structured companies, roles, tools or tags that can enrich the public bio.

alter table public.profiles
  add column if not exists bio_references jsonb not null default '[]'::jsonb;
