"""
CLI: generate AI supply chain insights and write to Supabase.

Usage:
    uv run python insights.py            # full run
    uv run python insights.py --dry-run  # print detections, skip Claude + DB
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from datetime import date

import anthropic

from store import get_client, insert_insight
from topology import load as load_topology
import analytics

log = logging.getLogger(__name__)

# ─── Models & pricing ─────────────────────────────────────────────────────────

HAIKU  = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-6"

_PRICE = {
    HAIKU:  {"in": 0.80e-6, "out": 4.00e-6, "cw": 1.00e-6, "cr": 0.08e-6},
    SONNET: {"in": 3.00e-6, "out": 15.0e-6, "cw": 3.75e-6, "cr": 0.30e-6},
}

def _cost(usage, model: str) -> float:
    p = _PRICE.get(model, _PRICE[SONNET])
    return (
        getattr(usage, "input_tokens", 0)                   * p["in"]
        + getattr(usage, "output_tokens", 0)                * p["out"]
        + getattr(usage, "cache_creation_input_tokens", 0)  * p["cw"]
        + getattr(usage, "cache_read_input_tokens", 0)      * p["cr"]
    )

# ─── Prompt helpers ───────────────────────────────────────────────────────────

def _topology_context(topo) -> str:
    """Stable topology description — cached across all Haiku calls in one run."""
    layers = "\n".join(f"  {l.name} ({l.id})" for l in topo.layers)
    by_layer: dict[str, list[str]] = {}
    for t in topo.tickers:
        by_layer.setdefault(t.layer, []).append(t.symbol)
    tickers = "\n".join(
        f"  {lid}: {', '.join(syms)}" for lid, syms in by_layer.items()
    )
    return (
        "You are an AI supply chain equity analyst. "
        "The supply chain runs: raw materials → energy/storage → foundries → chip design → datacenter → applications.\n\n"
        f"LAYERS:\n{layers}\n\nTICKERS BY LAYER:\n{tickers}"
    )


def _call(
    client: anthropic.Anthropic,
    model: str,
    topo_ctx: str,
    prompt: str,
    max_tokens: int = 250,
) -> tuple[str, object]:
    msg = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=[{"type": "text", "text": topo_ctx, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text if msg.content else ""
    return text, msg.usage

# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate supply chain insights")
    parser.add_argument("--dry-run", action="store_true", help="Detect only; skip Claude and DB writes")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not args.dry_run and (not api_key or api_key.startswith("REPLACE")):
        print("ERROR: set ANTHROPIC_API_KEY in agent/.env", file=sys.stderr)
        return 1

    t0 = time.monotonic()
    topo = load_topology()

    # Build lookup maps
    symbol_layer: dict[str, str] = {t.symbol: t.layer for t in topo.tickers}
    tickers_by_layer: dict[str, list[str]] = {}
    for t in topo.tickers:
        if not t.needs_verification:
            tickers_by_layer.setdefault(t.layer, []).append(t.symbol)
    fetchable = [t.symbol for t in topo.tickers if not t.needs_verification]

    ai_client = anthropic.Anthropic(api_key=api_key)
    topo_ctx = _topology_context(topo)
    today = date.today().isoformat()
    total_cost = 0.0
    n_written = 0

    # ── 1. Volume spikes ───────────────────────────────────────────────────────
    print("Detecting volume spikes...")
    spikes = analytics.detect_volume_spikes(fetchable, symbol_layer)
    print(f"  {len(spikes)} spike(s) found")
    for s in spikes[:5]:
        print(f"    {s.symbol}: {s.z_score:.1f}σ  ({s.today_volume:,} vs {int(s.avg_30d_volume):,} avg)")
        if args.dry_run:
            continue
        prompt = (
            f"Volume spike: {s.symbol} traded {s.today_volume:,} shares today "
            f"vs {int(s.avg_30d_volume):,} 30d avg ({s.z_score:.1f}σ above mean). "
            "Write 1-2 sentences on what this could signal for AI supply chain investors. "
            "Be specific — name the company's role in the chain."
        )
        narrative, usage = _call(ai_client, HAIKU, topo_ctx, prompt)
        cost = _cost(usage, HAIKU)
        total_cost += cost
        insert_insight(
            kind="anomaly",
            title=f"{s.symbol} volume spike — {s.z_score:.1f}× avg",
            body=narrative,
            related_symbols=[s.symbol],
            related_layers=[s.layer_id],
            model=HAIKU,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cost_usd=cost,
        )
        n_written += 1

    # ── 2. Layer divergence ────────────────────────────────────────────────────
    print("Detecting layer divergence...")
    divergences = analytics.detect_layer_divergence(tickers_by_layer)
    print(f"  {len(divergences)} divergence(s) found")
    for d in divergences:
        syms_str = ", ".join(d.top_symbols)
        print(f"    {d.layer_name}: {d.median_5d_pct:+.1f}% vs basket {d.basket_median_pct:+.1f}% ({d.z_score:+.2f}σ)  top: {syms_str}")
        if args.dry_run:
            continue
        hot_cold = "Hot" if d.z_score > 0 else "Cold"
        prompt = (
            f"Layer divergence: {d.layer_name} has median 5d return {d.median_5d_pct:+.1f}% "
            f"vs basket {d.basket_median_pct:+.1f}% ({d.z_score:+.2f}σ). "
            f"Top movers: {syms_str}. "
            "Write 1-2 sentences on what this supply chain flow signal means for investors. Be specific."
        )
        narrative, usage = _call(ai_client, HAIKU, topo_ctx, prompt)
        cost = _cost(usage, HAIKU)
        total_cost += cost
        insert_insight(
            kind="flow",
            title=f"{hot_cold} strand: {d.layer_name} {d.z_score:+.1f}σ from basket",
            body=narrative,
            related_symbols=d.top_symbols,
            related_layers=[d.layer_id],
            model=HAIKU,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cost_usd=cost,
        )
        n_written += 1

    # ── 3. Correlation breaks ──────────────────────────────────────────────────
    print("Detecting correlation breaks...")
    breaks = analytics.detect_correlation_breaks(fetchable)
    print(f"  {len(breaks)} break(s) found")
    for b in breaks[:3]:
        print(f"    {b.sym1}↔{b.sym2}: base={b.baseline_corr:.2f} cur={b.current_corr:.2f} ({b.z_score:+.2f}σ)")
        if args.dry_run:
            continue
        prompt = (
            f"Correlation break: {b.sym1} and {b.sym2} are decoupling. "
            f"90d correlation: {b.baseline_corr:.2f} → 5d: {b.current_corr:.2f} ({b.z_score:+.2f}σ shift). "
            "Write 1-2 sentences on what this supply chain decoupling could mean for investors. Be specific."
        )
        narrative, usage = _call(ai_client, HAIKU, topo_ctx, prompt)
        cost = _cost(usage, HAIKU)
        total_cost += cost
        insert_insight(
            kind="signal",
            title=f"{b.sym1}↔{b.sym2} correlation break ({b.z_score:+.1f}σ)",
            body=narrative,
            related_symbols=[b.sym1, b.sym2],
            related_layers=list({symbol_layer.get(b.sym1, ""), symbol_layer.get(b.sym2, "")} - {""}),
            model=HAIKU,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cost_usd=cost,
        )
        n_written += 1

    # ── 4. Daily summary (Sonnet) ──────────────────────────────────────────────
    print("Writing daily summary (Sonnet)...")
    if not args.dry_run:
        signal_lines: list[str] = []
        if spikes:
            signal_lines.append("Volume spikes: " + ", ".join(f"{s.symbol}({s.z_score:.1f}σ)" for s in spikes[:5]))
        if divergences:
            signal_lines.append("Layer divergences: " + ", ".join(f"{d.layer_name}({d.z_score:+.2f}σ)" for d in divergences))
        if breaks:
            signal_lines.append("Correlation breaks: " + ", ".join(f"{b.sym1}↔{b.sym2}({b.z_score:+.2f}σ)" for b in breaks[:3]))
        if not signal_lines:
            signal_lines.append("No significant signals today — markets quiet across the supply chain.")

        summary_prompt = (
            f"Today ({today}) AI supply chain signals:\n"
            + "\n".join(signal_lines)
            + "\n\nWrite 3-4 sentences as a daily context note for an equity investor. "
            "Summarize key themes, name specific companies and layers, and close with one forward-looking observation. "
            "Be direct and data-grounded."
        )
        narrative, usage = _call(ai_client, SONNET, topo_ctx, summary_prompt, max_tokens=400)
        cost = _cost(usage, SONNET)
        total_cost += cost
        insert_insight(
            kind="daily",
            title=f"Daily summary — {today}",
            body=narrative,
            related_symbols=[],
            related_layers=[],
            model=SONNET,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cost_usd=cost,
        )
        n_written += 1

    duration = time.monotonic() - t0
    dry = " (dry run)" if args.dry_run else ""
    print(f"\nDone in {duration:.1f}s{dry}. {n_written} insight(s) written. Est. cost: ${total_cost:.4f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
