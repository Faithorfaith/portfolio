-- Link an optional published article to a case study.

alter table public.case_studies
  add column if not exists related_article_id uuid references public.writings(id) on delete set null;

create index if not exists idx_case_studies_related_article_id
  on public.case_studies(related_article_id);
