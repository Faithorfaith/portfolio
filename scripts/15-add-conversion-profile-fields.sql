-- Conversion-focused profile content used by the public homepage and contact CTAs.
alter table public.profiles
  add column if not exists positioning_headline text,
  add column if not exists supporting_statement text,
  add column if not exists availability_status text,
  add column if not exists contact_email text,
  add column if not exists linkedin_url text,
  add column if not exists resume_url text,
  add column if not exists primary_cta_label text default 'Start a project',
  add column if not exists testimonials jsonb not null default '[]'::jsonb;

comment on column public.profiles.testimonials is
  'Array of {id, quote, name, role, company, url} objects shown as client proof.';
