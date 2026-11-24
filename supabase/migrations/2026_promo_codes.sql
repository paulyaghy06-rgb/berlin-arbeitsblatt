-- LehrReich Studio – Promo-Codes (10 zufällige Freimonat-Codes ohne Kreditkarte)
-- Einmalig im Supabase SQL Editor ausführen (100 % idempotent).

-- Stellt sicher, dass user_subscriptions existiert (falls 2026_billing_and_usage.sql noch nicht lief)
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

-- 1. Gutschein-Codes (nur serverseitig über Service Role beschreibbar)
create table if not exists public.promo_codes (
  code text primary key,
  label text not null default 'Freimonat (30 Tage Pro)',
  duration_days integer not null default 30 check (duration_days > 0),
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

-- 2. Einlösungen pro Nutzer (verhindert Mehrfach-Einlösung desselben Codes durch denselben Nutzer)
create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.promo_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code, user_id)
);

alter table public.promo_redemptions enable row level security;

drop policy if exists "Users can view own promo redemptions" on public.promo_redemptions;
create policy "Users can view own promo redemptions"
  on public.promo_redemptions
  for select
  using (auth.uid() = user_id);

-- 3. 10 zufällige, einmalig einlösbare Freimonat-Codes fürs Praxissemester (je 30 Tage Pro)
insert into public.promo_codes (code, label, duration_days, max_uses, active)
values
  ('LR-G9S3-MSW4', 'Praxissemester Freimonat #1', 30, 1, true),
  ('LR-9BAQ-TVD2', 'Praxissemester Freimonat #2', 30, 1, true),
  ('LR-DW53-RD24', 'Praxissemester Freimonat #3', 30, 1, true),
  ('LR-CN23-NJCR', 'Praxissemester Freimonat #4', 30, 1, true),
  ('LR-HZLP-3NL9', 'Praxissemester Freimonat #5', 30, 1, true),
  ('LR-L9YD-9REQ', 'Praxissemester Freimonat #6', 30, 1, true),
  ('LR-BG4N-2R8G', 'Praxissemester Freimonat #7', 30, 1, true),
  ('LR-M6P3-GXW9', 'Praxissemester Freimonat #8', 30, 1, true),
  ('LR-S777-UFVB', 'Praxissemester Freimonat #9', 30, 1, true),
  ('LR-27S4-99Y8', 'Praxissemester Freimonat #10', 30, 1, true)
on conflict (code) do nothing;
