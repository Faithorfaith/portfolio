-- Create portfolio_tools table (renamed from portfolio_works, with new fields for icon preview)
create table if not exists public.portfolio_tools (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  short_bio text,
  description text,
  icon_url text,
  link text,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create writing table for Substack imports
create table if not exists public.writing (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  excerpt text,
  content text,
  image_url text,
  substack_url text,
  published_at timestamp with time zone,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create case_studies table with rich text content
create table if not exists public.case_studies (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  excerpt text,
  thumbnail_url text,
  content jsonb not null default '[]',
  ai_generated boolean default false,
  tags text[],
  order_index integer default 0,
  published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_portfolio_tools_user_id on public.portfolio_tools(user_id);
create index if not exists idx_portfolio_tools_order on public.portfolio_tools(order_index);
create index if not exists idx_writing_user_id on public.writing(user_id);
create index if not exists idx_writing_published on public.writing(published_at);
create index if not exists idx_case_studies_user_id on public.case_studies(user_id);
create index if not exists idx_case_studies_published on public.case_studies(published);

-- Enable RLS for new tables
alter table public.portfolio_tools enable row level security;
alter table public.writing enable row level security;
alter table public.case_studies enable row level security;

-- RLS Policies for portfolio_tools
create policy "portfolio_tools_are_public" on public.portfolio_tools
  for select using (true);

create policy "users_can_manage_own_tools" on public.portfolio_tools
  for insert with check (auth.uid() = user_id);

create policy "users_can_update_own_tools" on public.portfolio_tools
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_can_delete_own_tools" on public.portfolio_tools
  for delete using (auth.uid() = user_id);

-- RLS Policies for writing
create policy "writing_are_public" on public.writing
  for select using (true);

create policy "users_can_manage_own_writing" on public.writing
  for insert with check (auth.uid() = user_id);

create policy "users_can_update_own_writing" on public.writing
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_can_delete_own_writing" on public.writing
  for delete using (auth.uid() = user_id);

-- RLS Policies for case_studies
create policy "case_studies_published_public" on public.case_studies
  for select using (published = true OR auth.uid() = user_id);

create policy "users_can_manage_own_case_studies" on public.case_studies
  for insert with check (auth.uid() = user_id);

create policy "users_can_update_own_case_studies" on public.case_studies
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_can_delete_own_case_studies" on public.case_studies
  for delete using (auth.uid() = user_id);
