-- Reconcile the application schema before further feature work.
-- Run after scripts 01-06. Existing rows are preserved.

do $$
begin
  if to_regclass('public.writings') is null and to_regclass('public.writing') is not null then
    alter table public.writing rename to writings;
  end if;
end $$;

alter table public.profiles
  add column if not exists button_text text,
  add column if not exists button_url text;

alter table public.writings
  add column if not exists slug text,
  add column if not exists content jsonb not null default '[]'::jsonb,
  add column if not exists cover_image text,
  add column if not exists published boolean not null default false;

create unique index if not exists idx_writings_slug on public.writings(slug) where slug is not null;
create index if not exists idx_writings_user_id on public.writings(user_id);
create index if not exists idx_writings_published on public.writings(published);

alter table public.writings enable row level security;
drop policy if exists "writing_select" on public.writings;
drop policy if exists "writing_insert" on public.writings;
drop policy if exists "writing_update" on public.writings;
drop policy if exists "writing_delete" on public.writings;
create policy "writings_select" on public.writings for select using (published = true or auth.uid() = user_id);
create policy "writings_insert" on public.writings for insert with check (auth.uid() = user_id);
create policy "writings_update" on public.writings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "writings_delete" on public.writings for delete using (auth.uid() = user_id);
