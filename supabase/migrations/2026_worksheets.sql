-- LehrReich Studio – Cloud-Bibliothek („Meine Blätter“)
-- Einmalig im Supabase SQL Editor ausführen (100 % idempotent).

create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Arbeitsblatt',
  subject text not null default '',
  grade text not null default '',
  region text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Falls eine ältere worksheets-Tabelle bereits existiert, fehlende Spalten sicher ergänzen
alter table public.worksheets add column if not exists title text not null default 'Arbeitsblatt';
alter table public.worksheets add column if not exists subject text not null default '';
alter table public.worksheets add column if not exists grade text not null default '';
alter table public.worksheets add column if not exists region text not null default '';
alter table public.worksheets add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.worksheets add column if not exists created_at timestamptz not null default now();
alter table public.worksheets add column if not exists updated_at timestamptz not null default now();

-- Falls aus einer älteren Version noch eine Pflichtspalte "content" existiert, NOT NULL entfernen
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'worksheets'
      and column_name = 'content'
  ) then
    execute 'alter table public.worksheets alter column content drop not null';
  end if;
end $$;

create index if not exists idx_worksheets_user_created
  on public.worksheets (user_id, created_at desc);

alter table public.worksheets enable row level security;

drop policy if exists "Users can view own worksheets" on public.worksheets;
create policy "Users can view own worksheets"
  on public.worksheets
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own worksheets" on public.worksheets;
create policy "Users can insert own worksheets"
  on public.worksheets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own worksheets" on public.worksheets;
create policy "Users can update own worksheets"
  on public.worksheets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own worksheets" on public.worksheets;
create policy "Users can delete own worksheets"
  on public.worksheets
  for delete
  using (auth.uid() = user_id);
