-- Current portfolio/admin schema (October 2026)
-- Safe to run more than once in the Supabase SQL editor.
-- Preserves existing rows and reconciles every field used by the public site and admin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'User',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists hero_image_1 text,
  add column if not exists hero_image_2 text,
  add column if not exists hero_image_3 text,
  add column if not exists gallery_images jsonb not null default '[]'::jsonb,
  add column if not exists bio_references jsonb not null default '[]'::jsonb,
  add column if not exists positioning_headline text,
  add column if not exists supporting_statement text,
  add column if not exists availability_status text,
  add column if not exists contact_email text,
  add column if not exists whatsapp_url text,
  add column if not exists x_url text,
  add column if not exists linkedin_url text,
  add column if not exists resume_url text,
  add column if not exists primary_cta_label text default 'Start a project',
  add column if not exists testimonials jsonb not null default '[]'::jsonb,
  add column if not exists button_text text,
  add column if not exists button_url text,
  add column if not exists train_music_url text,
  add column if not exists train_video_1 text,
  add column if not exists train_video_2 text,
  add column if not exists train_video_3 text,
  add column if not exists train_video_4 text;

create table if not exists public.portfolio_works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled playground study',
  description text,
  media_url text not null,
  media_type text not null default 'image',
  thumbnail_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_works
  add column if not exists name text,
  add column if not exists type text,
  add column if not exists brief_info text;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text,
  description text,
  link text,
  type text,
  year text,
  date_from text,
  date_to text,
  is_new boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.writings') is null and to_regclass('public.writing') is not null then
    alter table public.writing rename to writings;
  end if;
end $$;

create table if not exists public.writings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text,
  content jsonb not null default '[]'::jsonb,
  excerpt text,
  cover_image text,
  published boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.writings
  add column if not exists image_url text,
  add column if not exists substack_url text,
  add column if not exists published_at timestamptz,
  add column if not exists sections jsonb not null default '[]'::jsonb,
  add column if not exists nav_items jsonb not null default '[]'::jsonb,
  add column if not exists audio_url text,
  add column if not exists audio_voice text;

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  excerpt text,
  thumbnail_url text,
  content jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  nav_items jsonb not null default '[]'::jsonb,
  blocks jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.case_studies
  add column if not exists slug text,
  add column if not exists video_url text,
  add column if not exists media_type text default 'image',
  add column if not exists ai_generated boolean not null default false,
  add column if not exists tags text[],
  add column if not exists cta_text text,
  add column if not exists cta_link text,
  add column if not exists related_article_id uuid references public.writings(id) on delete set null;

create table if not exists public.workflow_files (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workflow_file_versions (
  id uuid primary key default gen_random_uuid(), workflow_file_id uuid not null references public.workflow_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, version_number integer not null check (version_number > 0),
  file_name text not null, file_url text not null, notes text, created_at timestamptz not null default now(),
  unique (workflow_file_id, version_number)
);

create unique index if not exists idx_writings_slug on public.writings(slug) where slug is not null;
create unique index if not exists idx_case_studies_slug on public.case_studies(slug) where slug is not null;
create index if not exists idx_case_studies_owner_order on public.case_studies(user_id, order_index);
create index if not exists idx_case_studies_published on public.case_studies(published);
create index if not exists idx_case_studies_related_article_id on public.case_studies(related_article_id);
create index if not exists idx_projects_owner_order on public.projects(user_id, order_index);
create index if not exists idx_portfolio_works_owner_created on public.portfolio_works(user_id, created_at desc);
create index if not exists idx_writings_owner_published on public.writings(user_id, published);
create index if not exists idx_workflow_files_owner_updated on public.workflow_files(user_id, updated_at desc);
create index if not exists idx_workflow_versions_file on public.workflow_file_versions(workflow_file_id, version_number desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare table_name text; begin
  foreach table_name in array array['profiles','portfolio_works','projects','writings','case_studies','workflow_files'] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.portfolio_works enable row level security;
alter table public.projects enable row level security;
alter table public.writings enable row level security;
alter table public.case_studies enable row level security;
alter table public.workflow_files enable row level security;
alter table public.workflow_file_versions enable row level security;

drop policy if exists profiles_select on public.profiles; drop policy if exists profiles_insert on public.profiles; drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists portfolio_works_select on public.portfolio_works; drop policy if exists portfolio_works_insert on public.portfolio_works; drop policy if exists portfolio_works_update on public.portfolio_works; drop policy if exists portfolio_works_delete on public.portfolio_works;
create policy portfolio_works_select on public.portfolio_works for select using (true);
create policy portfolio_works_insert on public.portfolio_works for insert with check (auth.uid() = user_id);
create policy portfolio_works_update on public.portfolio_works for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy portfolio_works_delete on public.portfolio_works for delete using (auth.uid() = user_id);

drop policy if exists projects_select on public.projects; drop policy if exists projects_insert on public.projects; drop policy if exists projects_update on public.projects; drop policy if exists projects_delete on public.projects;
create policy projects_select on public.projects for select using (true);
create policy projects_insert on public.projects for insert with check (auth.uid() = user_id);
create policy projects_update on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy projects_delete on public.projects for delete using (auth.uid() = user_id);

drop policy if exists writings_select on public.writings; drop policy if exists writings_insert on public.writings; drop policy if exists writings_update on public.writings; drop policy if exists writings_delete on public.writings;
create policy writings_select on public.writings for select using (published = true or auth.uid() = user_id);
create policy writings_insert on public.writings for insert with check (auth.uid() = user_id);
create policy writings_update on public.writings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy writings_delete on public.writings for delete using (auth.uid() = user_id);

drop policy if exists case_studies_select on public.case_studies; drop policy if exists case_studies_insert on public.case_studies; drop policy if exists case_studies_update on public.case_studies; drop policy if exists case_studies_delete on public.case_studies;
create policy case_studies_select on public.case_studies for select using (published = true or auth.uid() = user_id);
create policy case_studies_insert on public.case_studies for insert with check (auth.uid() = user_id);
create policy case_studies_update on public.case_studies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy case_studies_delete on public.case_studies for delete using (auth.uid() = user_id);

drop policy if exists published_workflow_files_are_public on public.workflow_files; drop policy if exists owners_manage_workflow_files on public.workflow_files;
drop policy if exists published_workflow_versions_are_public on public.workflow_file_versions; drop policy if exists owners_manage_workflow_versions on public.workflow_file_versions;
create policy published_workflow_files_are_public on public.workflow_files for select using (published = true or auth.uid() = user_id);
create policy owners_manage_workflow_files on public.workflow_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy published_workflow_versions_are_public on public.workflow_file_versions for select using (auth.uid() = user_id or exists (select 1 from public.workflow_files f where f.id = workflow_file_id and f.published = true));
create policy owners_manage_workflow_versions on public.workflow_file_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-uploads', 'portfolio-uploads', true, 104857600, null)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = null;
drop policy if exists portfolio_uploads_public_read on storage.objects;
drop policy if exists portfolio_uploads_authenticated_insert on storage.objects;
drop policy if exists portfolio_uploads_authenticated_update on storage.objects;
drop policy if exists portfolio_uploads_authenticated_delete on storage.objects;
create policy portfolio_uploads_public_read on storage.objects for select using (bucket_id = 'portfolio-uploads');
create policy portfolio_uploads_authenticated_insert on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-uploads');
create policy portfolio_uploads_authenticated_update on storage.objects for update to authenticated using (bucket_id = 'portfolio-uploads') with check (bucket_id = 'portfolio-uploads');
create policy portfolio_uploads_authenticated_delete on storage.objects for delete to authenticated using (bucket_id = 'portfolio-uploads');
