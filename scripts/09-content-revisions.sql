-- Additive migration: run in Supabase SQL Editor.
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('writing', 'case-study')),
  entity_id text not null,
  draft jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists content_revisions_lookup on public.content_revisions(user_id, kind, entity_id, created_at desc);
alter table public.content_revisions enable row level security;
drop policy if exists "Read own revisions" on public.content_revisions;
create policy "Read own revisions" on public.content_revisions for select to authenticated using (user_id = auth.uid());
drop policy if exists "Create own revisions" on public.content_revisions;
create policy "Create own revisions" on public.content_revisions for insert to authenticated with check (
  user_id = auth.uid() and (
    (kind = 'writing' and exists (select 1 from public.writings w where w.id::text = entity_id and w.user_id = auth.uid())) or
    (kind = 'case-study' and exists (select 1 from public.case_studies c where c.id::text = entity_id and c.user_id = auth.uid()))
  )
);
grant select, insert on public.content_revisions to authenticated;
create or replace function public.capture_content_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
declare content_kind text;
begin
  content_kind := case when TG_TABLE_NAME = 'writings' then 'writing' else 'case-study' end;
  if TG_OP = 'UPDATE' then
    if to_jsonb(OLD) = to_jsonb(NEW) then return NEW; end if;
    insert into public.content_revisions(user_id, kind, entity_id, draft) values (OLD.user_id, content_kind, OLD.id::text, to_jsonb(OLD));
  end if;
  insert into public.content_revisions(user_id, kind, entity_id, draft) values (NEW.user_id, content_kind, NEW.id::text, to_jsonb(NEW));
  return NEW;
end;
$$;
revoke all on function public.capture_content_revision() from public;
drop trigger if exists capture_writing_revision on public.writings;
create trigger capture_writing_revision after insert or update on public.writings for each row execute function public.capture_content_revision();
drop trigger if exists capture_case_revision on public.case_studies;
create trigger capture_case_revision after insert or update on public.case_studies for each row execute function public.capture_content_revision();
