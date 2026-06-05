# Agent — Python Data Pipeline

The Python agent is the only writer to the database. It pulls EOD prices, detects anomalies, and generates Claude-powered insights.

## Setup

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

uv sync
```

## Commands

```bash
# Initial backfill (run once)
uv run python refresh.py -v --period 2y

# Daily incremental refresh
uv run python refresh.py --period 1mo

# Anomaly detection + insights generation
uv run python insights.py

# Refresh specific symbols only
uv run python refresh.py --symbols NVDA TSM --period 1mo
```

## Files

| File | Purpose |
|---|---|
| `refresh.py` | CLI entry — fetches prices from yfinance, writes to Supabase |
| `insights.py` | Runs analytics detectors, calls Claude, writes to `insights` table |
| `analytics.py` | Pure computation: volume spikes, layer divergence, correlation breaks |
| `fetcher.py` | yfinance wrapper with retry/backoff |
| `store.py` | Supabase client wrapper (upsert, bulk insert) |
| `topology.py` | Loads `../topology.yaml` into typed dataclasses |

## Cron schedule

See `scheduler/crontab.example` for a ready-to-use cron configuration. Runs the incremental refresh and insights pipeline on weekdays after market close.

## Failure handling

Failed symbols are written to `refresh_log.failed_symbols`. The dashboard always shows the last refresh timestamp. If yfinance returns empty data for a symbol, it's skipped and logged — it never silently corrupts the database.
