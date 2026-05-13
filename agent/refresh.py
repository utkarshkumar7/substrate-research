"""CLI: pull EOD prices into Supabase.

Usage:
    uv run python refresh.py                    # 1mo, all fetchable symbols
    uv run python refresh.py -v --period 2y     # initial load
    uv run python refresh.py --symbols NVDA AMD # specific symbols
"""
from __future__ import annotations
import argparse
import logging
import sys
import time

from topology import load as load_topology
import fetcher
import store


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh EOD prices in Supabase")
    parser.add_argument(
        "--period",
        choices=["2y", "6mo", "1mo", "5d"],
        default="1mo",
        help="yfinance history period (default: 1mo; use 2y for initial load)",
    )
    parser.add_argument(
        "--symbols",
        nargs="+",
        metavar="SYM",
        help="Override: fetch only these symbols",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    if args.verbose:
        logging.getLogger("fetcher").setLevel(logging.DEBUG)
        logging.getLogger("store").setLevel(logging.DEBUG)
        logging.getLogger(__name__).setLevel(logging.DEBUG)

    t0 = time.monotonic()
    topo = load_topology()

    # --- 1. Register all tickers (including needs_verification ones) ---
    if args.verbose:
        print(f"Registering {len(topo.tickers)} tickers in Supabase...")
    for t in topo.tickers:
        store.upsert_ticker(
            symbol=t.symbol,
            name=t.name,
            layer=t.layer,
            subcategory=t.subcategory or None,
            notes=t.notes,
            is_etf=t.is_etf,
            needs_verification=t.needs_verification,
        )

    # Register macro proxy ETFs and benchmark ETFs so prices FK is satisfied.
    known_symbols = {t.symbol for t in topo.tickers}
    extra_etfs: dict[str, str] = {}  # symbol → name
    for sig in topo.macro_signals:
        proxy = sig.yfinance_proxy
        if proxy not in known_symbols:
            extra_etfs[proxy] = proxy
    for sym in topo.benchmark_etfs:
        if sym not in known_symbols:
            extra_etfs[sym] = sym
    if extra_etfs and args.verbose:
        print(f"Registering {len(extra_etfs)} macro/benchmark ETFs: {list(extra_etfs)}")
    for sym, name in extra_etfs.items():
        store.upsert_ticker(
            symbol=sym,
            name=name,
            layer="benchmark",
            subcategory="etf",
            notes=None,
            is_etf=True,
            needs_verification=False,
        )
        known_symbols.add(sym)

    # --- 2. Determine symbols to fetch ---
    if args.symbols:
        symbols = args.symbols
        if args.verbose:
            print(f"Symbol override: {symbols}")
    else:
        symbols = topo.all_symbols_to_fetch()

    if args.verbose:
        print(f"\nFetching {len(symbols)} symbols (period={args.period}):")

    # --- 3. Fetch and write prices ---
    results, failed = fetcher.fetch_batch(symbols, period=args.period, verbose=args.verbose)

    if args.verbose:
        print(f"\nWriting prices to Supabase...")

    total_rows = 0
    for symbol, rows in results.items():
        store.insert_prices(rows)
        store.mark_synced(symbol, error=None)
        total_rows += len(rows)

    for symbol in failed:
        store.mark_synced(symbol, error="fetch returned no data")

    duration = time.monotonic() - t0

    # --- 4. Log the run ---
    store.log_refresh(
        success=len(failed) == 0,
        n_tickers=len(symbols),
        n_failed=len(failed),
        duration_s=duration,
        failed_symbols=failed,
    )

    # --- 5. Summary ---
    if args.verbose or failed:
        print(f"\n{'='*50}")
        print(f"Done in {duration:.1f}s")
        print(f"  Symbols attempted : {len(symbols)}")
        print(f"  Succeeded         : {len(results)}")
        print(f"  Failed            : {len(failed)}")
        print(f"  Total price rows  : {total_rows}")
        if failed:
            print(f"  Failed symbols    : {', '.join(failed)}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
