-- Rode no SQL Editor do Supabase.
create table if not exists public.orbis_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.orbis_state enable row level security;
create policy "dono lê e grava" on public.orbis_state for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Imagens das ofertas ficam em storage e são copiadas pelo endpoint autenticado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('offer-images', 'offer-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
