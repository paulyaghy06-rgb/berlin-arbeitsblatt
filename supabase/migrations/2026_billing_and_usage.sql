-- LehrReich Billing & Usage Migration
-- Einmalig im Supabase SQL Editor ausführen (idempotent).

-- 1. Abonnements pro Supabase-User (nur serverseitig über Service Role beschreibbar)
create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.user_subscriptions;
create policy "Users can view own subscription"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

-- 2. Monatliche Nutzungszählung für Free-Tier & Missbrauchsschutz
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_key text,
  action text not null check (action in ('generate', 'refine', 'edit')),
  month_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_events_user_month_action
  on public.usage_events (user_id, month_key, action);

create index if not exists idx_usage_events_anon_month_action
  on public.usage_events (anon_key, month_key, action);

alter table public.usage_events enable row level security;

drop policy if exists "Users can view own usage events" on public.usage_events;
create policy "Users can view own usage events"
  on public.usage_events
  for select
  using (auth.uid() = user_id);
