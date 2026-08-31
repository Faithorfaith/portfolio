-- Create projects table for "Projects I've Built" section
create table if not exists public.projects (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text,
  description text,
  link text,
  type text,
  year text,
  date_from text,
  date_to text,
  is_new boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_order_index on public.projects(order_index asc);

-- Enable RLS (Row Level Security)
alter table public.projects enable row level security;

-- RLS Policies for projects table
-- Anyone can view all projects
create policy "projects_are_public" on public.projects
  for select using (true);

-- Users can only manage their own projects
create policy "users_can_manage_own_projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "users_can_update_own_projects" on public.projects
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_can_delete_own_projects" on public.projects
  for delete using (auth.uid() = user_id);
