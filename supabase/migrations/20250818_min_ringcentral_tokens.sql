-- Minimal RingCentral tokens table aligned to unified schema
-- Safe to run even if other RingCentral migrations exist elsewhere

create table if not exists public.ringcentral_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_type text not null default 'Bearer',
  expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  scope text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.ringcentral_tokens enable row level security;

-- Basic RLS policies (Postgres does not support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "ringcentral_tokens_select_own" ON public.ringcentral_tokens;
CREATE POLICY "ringcentral_tokens_select_own"
  ON public.ringcentral_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "ringcentral_tokens_insert_own" ON public.ringcentral_tokens;
CREATE POLICY "ringcentral_tokens_insert_own"
  ON public.ringcentral_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ringcentral_tokens_update_own" ON public.ringcentral_tokens;
CREATE POLICY "ringcentral_tokens_update_own"
  ON public.ringcentral_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Helpful indexes
create index if not exists idx_ringcentral_tokens_user_id on public.ringcentral_tokens(user_id);
create index if not exists idx_ringcentral_tokens_expires_at on public.ringcentral_tokens(expires_at);

-- Refresh PostgREST schema cache
select pg_notify('pgrst', 'reload schema');

