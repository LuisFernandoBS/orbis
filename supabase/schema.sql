-- Rode no SQL Editor do Supabase.
create table if not exists public.orbis_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.orbis_state enable row level security;
create policy "dono lê e grava" on public.orbis_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
