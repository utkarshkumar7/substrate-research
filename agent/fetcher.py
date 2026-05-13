"""yfinance wrapper with retry + backoff."""
from __future__ import annotations
import time
import logging
from typing import Optional
import yfinance as yf

log = logging.getLogger(__name__)

_RETRY_ATTEMPTS = 3
_RETRY_BACKOFF = [1.0, 3.0, 8.0]  # seconds between retries
_SYMBOL_SLEEP = 0.4                # seconds between successive symbol fetches


def fetch_prices(symbol: str, period: str = "2y") -> list[dict]:
    """Fetch EOD OHLCV bars for *symbol* and return as a list of row dicts.

    Returns an empty list on persistent failure (caller decides what to log).
    """
    for attempt in range(_RETRY_ATTEMPTS):
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, auto_adjust=True, actions=False)
            if hist.empty:
                log.warning("%s: empty history on attempt %d", symbol, attempt + 1)
                if attempt < _RETRY_ATTEMPTS - 1:
                    time.sleep(_RETRY_BACKOFF[attempt])
                continue

            rows = []
            for trade_date, row in hist.iterrows():
                rows.append(
                    {
                        "symbol": symbol,
                        "trade_date": trade_date.strftime("%Y-%m-%d"),
                        "open": round(float(row["Open"]), 4) if row["Open"] == row["Open"] else None,
                        "high": round(float(row["High"]), 4) if row["High"] == row["High"] else None,
                        "low": round(float(row["Low"]), 4) if row["Low"] == row["Low"] else None,
                        "close": round(float(row["Close"]), 4),
                        "volume": int(row["Volume"]) if row["Volume"] == row["Volume"] else None,
                    }
                )
            return rows

        except Exception as exc:  # noqa: BLE001
            log.warning("%s: fetch error on attempt %d: %s", symbol, attempt + 1, exc)
            if attempt < _RETRY_ATTEMPTS - 1:
                time.sleep(_RETRY_BACKOFF[attempt])

    return []


def fetch_batch(
    symbols: list[str],
    period: str = "2y",
    verbose: bool = False,
) -> tuple[dict[str, list[dict]], list[str]]:
    """Fetch prices for a list of symbols sequentially.

    Returns (results_by_symbol, failed_symbols).
    """
    results: dict[str, list[dict]] = {}
    failed: list[str] = []

    for i, symbol in enumerate(symbols):
        if verbose:
            print(f"  [{i + 1}/{len(symbols)}] {symbol} ...", end=" ", flush=True)
        rows = fetch_prices(symbol, period=period)
        if rows:
            results[symbol] = rows
            if verbose:
                print(f"{len(rows)} bars")
        else:
            failed.append(symbol)
            if verbose:
                print("FAILED")
        if i < len(symbols) - 1:
            time.sleep(_SYMBOL_SLEEP)

    return results, failed
