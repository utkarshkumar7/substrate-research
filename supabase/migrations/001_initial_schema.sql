-- AI Supply Chain Command Center — initial schema
-- Run once in Supabase: Dashboard → SQL Editor → New Query → paste → Run

-- ============================================================
-- Tickers: metadata + sync state for every symbol in the topology
-- ============================================================
create table tickers (
  symbol             text primary key,
  name               text not null,
  layer              text not null,
  subcategory        text,
  is_etf             boolean not null default false,
  needs_verification boolean not null default false,
  notes              text,
  last_synced_at     timestamptz,
  last_error         text,
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- Prices: one row per (symbol, trade_date). EOD daily bars.
-- ============================================================
create table prices (
  symbol      text not null references tickers(symbol) on delete cascade,
  trade_date  date not null,
  open        numeric(20, 4),
  high        numeric(20, 4),
  low         numeric(20, 4),
  close       numeric(20, 4) not null,
  volume      bigint,
  primary key (symbol, trade_date)
);
create index idx_prices_date          on prices (trade_date desc);
create index idx_prices_symbol_date   on prices (symbol, trade_date desc);

-- ============================================================
-- Holdings: portfolio positions (single-user, manual entry for v1)
-- ============================================================
create table holdings (
  symbol      text primary key references tickers(symbol) on delete cascade,
  shares      numeric(20, 6) not null,
  cost_basis  numeric(20, 4),                -- per-share avg cost
  notes       text,
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Insights: AI-generated notes. Right-rail content + report archive.
-- ============================================================
create table insights (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  kind             text not null
                   check (kind in ('daily', 'weekly', 'anomaly', 'flow', 'signal', 'context')),
  title            text not null,
  body             text not null,
  related_symbols  text[] not null default '{}',
  related_layers   text[] not null default '{}',
  model            text,                      -- e.g. 'claude-sonnet-4-6'
  input_tokens     int,
  output_tokens    int,
  cost_usd         numeric(10, 6),
  metadata         jsonb                      -- z-scores, source URLs, etc
);
create index idx_insights_created       on insights (created_at desc);
create index idx_insights_kind_created  on insights (kind, created_at desc);

-- ============================================================
-- Refresh log: every Python pipeline run gets one row
-- ============================================================
create table refresh_log (
  id              uuid primary key default gen_random_uuid(),
  run_at          timestamptz not null default now(),
  success         boolean not null,
  n_tickers       int not null,
  n_failed        int not null default 0,
  duration_s      numeric(10, 2),
  failed_symbols  text[] not null default '{}',
  notes           text
);
create index idx_refresh_log_run on refresh_log (run_at desc);

-- ============================================================
-- Conversations + messages: persisted "Ask Claude" chats
-- ============================================================
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  title       text
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  metadata        jsonb         -- tool calls, token counts, citations
);
create index idx_messages_conversation on messages (conversation_id, created_at);

-- ============================================================
-- RLS: single-user app, no auth for v1. Disable RLS on all tables
-- and use the service-role key on the server. If/when multi-user
-- is needed, enable RLS and add policies per table.
-- ============================================================
alter table tickers       disable row level security;
alter table prices        disable row level security;
alter table holdings      disable row level security;
alter table insights      disable row level security;
alter table refresh_log   disable row level security;
alter table conversations disable row level security;
alter table messages      disable row level security;
