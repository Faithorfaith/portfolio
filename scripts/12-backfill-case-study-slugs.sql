-- Give existing case studies readable URLs based on their project titles.
-- New and edited records are slugged automatically by the API.

with generated as (
  select
    id,
    trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) as base_slug,
    row_number() over (
      partition by trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
      order by created_at asc, id asc
    ) as duplicate_number
  from public.case_studies
)
update public.case_studies as case_study
set slug = case
  when generated.duplicate_number = 1 then generated.base_slug
  else generated.base_slug || '-' || generated.duplicate_number::text
end
from generated
where case_study.id = generated.id
  and generated.base_slug <> '';

create unique index if not exists idx_case_studies_slug
on public.case_studies(slug)
where slug is not null;
