"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { layersInOrder, tickersByLayer } from "@/lib/topology";
import HeatRow from "./HeatRow";
import { pctForPeriod, medianPct, type SymbolSnapshot, type Period } from "@/lib/analytics/performance";

interface Props {
  snapshots: Record<string, SymbolSnapshot>;
}

const PERIODS: Period[] = ["1d", "5d", "1m", "YTD"];

export default function HeatmapClient({ snapshots }: Props) {
  const [period, setPeriod] = useState<Period>("5d");

  const layers = layersInOrder();

  // Build per-symbol pct map for active period
  const pctMap: Record<string, { pct: number | null }> = {};
  for (const [symbol, snap] of Object.entries(snapshots)) {
    pctMap[symbol] = { pct: pctForPeriod(snap, period) };
  }

  // Sort layers by median % change (hottest first)
  const layersWithScore = layers.map((layer) => {
    const symbols = tickersByLayer(layer.id)
      .filter((t) => !t.needsVerification)
      .map((t) => t.symbol);
    const pcts = symbols.map((s) => pctMap[s]?.pct ?? null);
    return { layer, symbols, score: medianPct(pcts) };
  });
  layersWithScore.sort((a, b) => b.score - a.score);

  return (
    <div>
      {/* Period chips */}
      <div className="flex gap-1.5 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              "rounded-full border px-2.5 py-0.5 cursor-pointer transition-colors",
              p === period
                ? "bg-accent border-accent text-bg font-medium"
                : "bg-bg border-border text-text-secondary hover:text-text"
            )}
            style={{ fontSize: 11 }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Layer rows */}
      {layersWithScore.map(({ layer, symbols }) => (
        <HeatRow
          key={layer.id}
          layerName={layer.name}
          layerColor={layer.color}
          symbols={symbols}
          snapshots={pctMap}
        />
      ))}
    </div>
  );
}
