"""
Detectors for the AI supply chain pipeline.
All functions are pure computation — no Claude calls, no side effects.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta

import numpy as np
import pandas as pd

from store import get_client

log = logging.getLogger(__name__)

# ─── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class VolumeSpike:
    symbol: str
    layer_id: str
    today_volume: int
    avg_30d_volume: float
    z_score: float


@dataclass
class LayerDivergence:
    layer_id: str
    layer_name: str
    median_5d_pct: float
    basket_median_pct: float
    z_score: float
    top_symbols: list[str] = field(default_factory=list)


@dataclass
class CorrelationBreak:
    sym1: str
    sym2: str
    baseline_corr: float
    current_corr: float
    z_score: float


# ─── Data fetching (paginated to bypass Supabase 1000-row limit) ───────────────

def _fetch_prices_df(
    symbols: list[str],
    days: int,
    col: str = "close",
) -> pd.DataFrame:
    """Return a date × symbol pivot for `col`, fetching pages of 900 rows."""
    since = (date.today() - timedelta(days=days + 10)).isoformat()
    client = get_client()
    rows: list[dict] = []
    page = 900
    start = 0
    while True:
        resp = (
            client.table("prices")
            .select(f"symbol, trade_date, {col}")
            .in_("symbol", symbols)
            .gte("trade_date", since)
            .order("trade_date")
            .order("symbol")
            .range(start, start + page - 1)
            .execute()
        )
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page:
            break
        start += page

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["trade_date"] = pd.to_datetime(df["trade_date"])
    df[col] = pd.to_numeric(df[col], errors="coerce")
    pivot = df.pivot_table(index="trade_date", columns="symbol", values=col)
    return pivot.sort_index().ffill()


# ─── Detectors ─────────────────────────────────────────────────────────────────

def detect_volume_spikes(
    symbols: list[str],
    symbol_layer: dict[str, str],
    threshold: float = 3.0,
    lookback: int = 30,
) -> list[VolumeSpike]:
    """Flag symbols whose latest volume is > threshold sigma above the 30-day mean."""
    vol = _fetch_prices_df(symbols, days=lookback + 5, col="volume")
    if vol.empty or len(vol) < 5:
        return []

    spikes: list[VolumeSpike] = []
    for sym in vol.columns:
        s = vol[sym].dropna()
        if len(s) < 10:
            continue
        today = float(s.iloc[-1])
        hist = s.iloc[:-1].tail(lookback)
        avg = float(hist.mean())
        std = float(hist.std())
        if std < 1 or avg < 10_000:  # skip near-zero volume
            continue
        z = (today - avg) / std
        if z >= threshold:
            spikes.append(VolumeSpike(
                symbol=sym,
                layer_id=symbol_layer.get(sym, ""),
                today_volume=int(today),
                avg_30d_volume=round(avg, 0),
                z_score=round(z, 2),
            ))

    spikes.sort(key=lambda x: x.z_score, reverse=True)
    return spikes


def detect_layer_divergence(
    tickers_by_layer: dict[str, list[str]],
    threshold: float = 2.0,
) -> list[LayerDivergence]:
    """Flag layers whose median 5d return is > threshold sigma from the basket median."""
    all_syms = [s for syms in tickers_by_layer.values() for s in syms]
    closes = _fetch_prices_df(all_syms, days=15)
    if closes.empty or len(closes) < 6:
        return []

    ret5d: dict[str, float] = {}
    for sym in closes.columns:
        s = closes[sym].dropna()
        if len(s) >= 6:
            ret5d[sym] = float((s.iloc[-1] / s.iloc[-6] - 1) * 100)

    layer_stats: dict[str, tuple[float, list[str]]] = {}
    for layer_id, syms in tickers_by_layer.items():
        vals = [ret5d[s] for s in syms if s in ret5d]
        if not vals:
            continue
        med = float(np.median(vals))
        top3 = sorted((s for s in syms if s in ret5d), key=lambda s: ret5d[s], reverse=True)[:3]
        layer_stats[layer_id] = (med, top3)

    if len(layer_stats) < 3:
        return []

    meds = [v[0] for v in layer_stats.values()]
    basket_med = float(np.median(meds))
    basket_std = float(np.std(meds))
    if basket_std < 0.01:
        return []

    divergences: list[LayerDivergence] = []
    for layer_id, (med, top3) in layer_stats.items():
        z = (med - basket_med) / basket_std
        if abs(z) >= threshold:
            divergences.append(LayerDivergence(
                layer_id=layer_id,
                layer_name=layer_id.replace("_", " ").title(),
                median_5d_pct=round(med, 2),
                basket_median_pct=round(basket_med, 2),
                z_score=round(z, 2),
                top_symbols=top3,
            ))

    divergences.sort(key=lambda x: abs(x.z_score), reverse=True)
    return divergences


def detect_correlation_breaks(
    symbols: list[str],
    window_long: int = 90,
    window_short: int = 5,
    threshold: float = 2.0,
    max_results: int = 10,
) -> list[CorrelationBreak]:
    """Find pairs whose short-term correlation has diverged > threshold sigma from baseline."""
    closes = _fetch_prices_df(symbols, days=window_long + window_short + 15)
    if closes.empty or len(closes) < window_long:
        return []

    # Only use symbols with sufficient history
    valid = [c for c in closes.columns if closes[c].count() >= window_long - 5]
    if len(valid) < 2:
        return []

    rets = closes[valid].pct_change().dropna(how="all")
    baseline_corr = rets.tail(window_long).corr()
    current_corr = rets.tail(window_short).corr()

    syms = list(baseline_corr.columns)
    breaks: list[CorrelationBreak] = []

    for i in range(len(syms)):
        for j in range(i + 1, len(syms)):
            s1, s2 = syms[i], syms[j]
            base = baseline_corr.loc[s1, s2]
            cur = current_corr.loc[s1, s2]
            if pd.isna(base) or pd.isna(cur) or abs(base) < 0.3:
                continue  # only flag meaningful correlation breaks

            # Rolling short-window correlation for std estimation
            pair = rets[[s1, s2]].dropna()
            if len(pair) < window_long:
                continue
            roll = pair[s1].rolling(window_short).corr(pair[s2]).dropna()
            if len(roll) < 10:
                continue
            std = float(roll.std())
            if std < 0.01:
                continue

            z = (cur - base) / std
            if abs(z) >= threshold:
                breaks.append(CorrelationBreak(
                    sym1=s1,
                    sym2=s2,
                    baseline_corr=round(float(base), 3),
                    current_corr=round(float(cur), 3),
                    z_score=round(float(z), 2),
                ))

    breaks.sort(key=lambda x: abs(x.z_score), reverse=True)
    return breaks[:max_results]
