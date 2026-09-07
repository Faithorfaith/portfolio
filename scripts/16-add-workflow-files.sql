insert into storage.buckets (id, name, public)
values ('portfolio-uploads', 'portfolio-uploads', true)
on conflict (id) do update set public = true;

create table if not exists public.workflow_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_file_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_file_id uuid not null references public.workflow_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  file_name text not null,
  file_url text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (workflow_file_id, version_number)
);

create index if not exists idx_workflow_files_updated on public.workflow_files(updated_at desc);
create index if not exists idx_workflow_versions_file on public.workflow_file_versions(workflow_file_id, version_number desc);
alter table public.workflow_files enable row level security;
alter table public.workflow_file_versions enable row level security;

create policy "published_workflow_files_are_public" on public.workflow_files for select using (published = true or auth.uid() = user_id);
create policy "owners_manage_workflow_files" on public.workflow_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "published_workflow_versions_are_public" on public.workflow_file_versions for select using (
  auth.uid() = user_id or exists (select 1 from public.workflow_files f where f.id = workflow_file_id and f.published = true)
);
create policy "owners_manage_workflow_versions" on public.workflow_file_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
