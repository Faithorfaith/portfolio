-- Create profiles table to store user profile information
create table if not exists public.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  hero_image_1 text,
  hero_image_2 text,
  hero_image_3 text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create portfolio_works table to store portfolio pieces
create table if not exists public.portfolio_works (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  media_url text not null,
  media_type text not null,
  thumbnail_url text,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_portfolio_works_user_id on public.portfolio_works(user_id);
create index if not exists idx_portfolio_works_created_at on public.portfolio_works(created_at desc);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.portfolio_works enable row level security;

-- RLS Policies for profiles table
-- Anyone can view public profiles
create policy "profiles_are_public" on public.profiles
  for select using (true);

-- Users can only update their own profile
create policy "users_can_update_own_profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can only insert their own profile
create policy "users_can_insert_own_profile" on public.profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for portfolio_works table
-- Anyone can view all portfolio works
create policy "portfolio_works_are_public" on public.portfolio_works
  for select using (true);

-- Users can only manage their own portfolio works
create policy "users_can_manage_own_works" on public.portfolio_works
  for insert with check (auth.uid() = user_id);

create policy "users_can_update_own_works" on public.portfolio_works
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_can_delete_own_works" on public.portfolio_works
  for delete using (auth.uid() = user_id);
