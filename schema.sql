-- Execute este SQL no SQL Editor do seu projeto Supabase.
create table if not exists public.dojo_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  habits jsonb not null default '[]'::jsonb,
  checks jsonb not null default '{}'::jsonb,
  journal jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.dojo_profiles enable row level security;
drop policy if exists "Users can read own dojo profile" on public.dojo_profiles;
create policy "Users can read own dojo profile" on public.dojo_profiles for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own dojo profile" on public.dojo_profiles;
create policy "Users can insert own dojo profile" on public.dojo_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own dojo profile" on public.dojo_profiles;
create policy "Users can update own dojo profile" on public.dojo_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
