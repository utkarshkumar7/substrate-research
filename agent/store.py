"""Supabase write operations for the data pipeline (service-role key only)."""
from __future__ import annotations
import os
import logging
from datetime import datetime, timezone
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def upsert_ticker(
    symbol: str,
    name: str,
    layer: str,
    subcategory: Optional[str],
    notes: Optional[str],
    is_etf: bool,
    needs_verification: bool,
) -> None:
    client = get_client()
    client.table("tickers").upsert(
        {
            "symbol": symbol,
            "name": name,
            "layer": layer,
            "subcategory": subcategory,
            "notes": notes,
            "is_etf": is_etf,
            "needs_verification": needs_verification,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="symbol",
    ).execute()


def insert_prices(rows: list[dict]) -> None:
    """Bulk upsert price rows. On conflict (symbol, trade_date) update OHLCV."""
    if not rows:
        return
    client = get_client()
    # Supabase upsert in chunks of 500 to stay under payload limits
    chunk_size = 500
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i : i + chunk_size]
        client.table("prices").upsert(chunk, on_conflict="symbol,trade_date").execute()


def mark_synced(symbol: str, error: Optional[str] = None) -> None:
    client = get_client()
    client.table("tickers").update(
        {
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "last_error": error,
        }
    ).eq("symbol", symbol).execute()


def insert_insight(
    kind: str,
    title: str,
    body: str,
    related_symbols: list[str],
    related_layers: list[str],
    model: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    metadata: Optional[dict] = None,
) -> None:
    client = get_client()
    client.table("insights").insert(
        {
            "kind": kind,
            "title": title,
            "body": body,
            "related_symbols": related_symbols,
            "related_layers": related_layers,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "metadata": metadata,
        }
    ).execute()


def log_refresh(
    success: bool,
    n_tickers: int,
    n_failed: int,
    duration_s: float,
    failed_symbols: list[str],
    notes: Optional[str] = None,
) -> None:
    client = get_client()
    client.table("refresh_log").insert(
        {
            "success": success,
            "n_tickers": n_tickers,
            "n_failed": n_failed,
            "duration_s": round(duration_s, 2),
            "failed_symbols": failed_symbols,
            "notes": notes,
        }
    ).execute()
