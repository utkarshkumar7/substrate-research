import { createClient } from "@/lib/supabase/server"
import { fetchableSymbols, layersInOrder, tickersByLayer } from "@/lib/topology"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import { pctForPeriod, medianPct } from "@/lib/analytics/performance"
import { formatPercent, stripMarkdown } from "@/lib/format"

export const metadata = { title: "Anomalies" }

const LAYER_COLORS: Record<string, string> = {
  raw:     "#b45309",
  energy:  "#ea580c",
  storage: "#e11d48",
  foundry: "#2563eb",
  chip:    "#4f46e5",
  quantum: "#7c3aed",
  dc:      "#0d9488",
  apps:    "#16a34a",
}

function zScoreColor(z: number): string {
  const abs = Math.abs(z)
  if (abs >= 2.5) return z > 0 ? "#4ade80" : "#f87171"
  if (abs >= 1.5) return z > 0 ? "#86efac" : "#fca5a5"
  return "#9ca3af"
}

export default async function AnomaliesPage() {
  const client = createClient()
  const symbols = fetchableSymbols()
  const layers = layersInOrder()

  // Fetch price + volume data (last 35 days for volume baseline)
  const since = new Date()
  since.setDate(since.getDate() - 45)

  const [snapshots, priceRows, insights] = await Promise.all([
    getHeatmapSnapshot(client, symbols),
    client
      .from("prices")
      .select("symbol, trade_date, close, volume")
      .in("symbol", symbols)
      .gte("trade_date", since.toISOString().slice(0, 10))
      .order("trade_date", { ascending: false }),
    client
      .from("insights")
      .select("id, kind, title, body, created_at")
      .in("kind", ["anomaly", "signal", "flow"])
      .gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  // ── Layer divergence ────────────────────────────────────────────────────────
  const layerStats = layers.map(l => {
    const syms = tickersByLayer(l.id).filter(t => !t.needsVerification).map(t => t.symbol)
    const pcts5d = syms.map(s => pctForPeriod(snapshots[s] ?? {} as never, "5d")).filter((v): v is number => v != null)
    return { layer: l, median5d: medianPct(pcts5d), count: pcts5d.length }
  }).filter(s => s.count >= 2)

  const allMedians = layerStats.map(s => s.median5d)
  const basketMedian = allMedians.reduce((a, b) => a + b, 0) / allMedians.length
  const basketStd = Math.sqrt(allMedians.reduce((a, b) => a + (b - basketMedian) ** 2, 0) / allMedians.length)

  const divergentLayers = layerStats
    .map(s => ({ ...s, z: basketStd > 0 ? (s.median5d - basketMedian) / basketStd : 0 }))
    .filter(s => Math.abs(s.z) >= 1.5)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))

  // ── Volume spikes ───────────────────────────────────────────────────────────
  const volBySymbol: Record<string, { dates: string[]; vols: number[] }> = {}
  for (const row of priceRows.data ?? []) {
    if (row.volume == null) continue
    ;(volBySymbol[row.symbol] ??= { dates: [], vols: [] }).dates.push(row.trade_date)
    volBySymbol[row.symbol].vols.push(Number(row.volume))
  }

  const volumeSpikes: { symbol: string; layer: string; todayVol: number; avgVol: number; z: number }[] = []
  for (const [sym, { vols }] of Object.entries(volBySymbol)) {
    if (vols.length < 10) continue
    const today = vols[0] // desc order
    const hist = vols.slice(1, 31)
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length
    const std = Math.sqrt(hist.reduce((a, b) => a + (b - avg) ** 2, 0) / hist.length)
    if (std < 1 || avg < 10_000) continue
    const z = (today - avg) / std
    if (z >= 2.0) {
      const layerId = layers.find(l => tickersByLayer(l.id).some(t => t.symbol === sym))?.id ?? ""
      volumeSpikes.push({ symbol: sym, layer: layerId, todayVol: today, avgVol: avg, z })
    }
  }
  volumeSpikes.sort((a, b) => b.z - a.z)

  const kindColor: Record<string, string> = {
    anomaly: "#f87171",
    signal:  "#22d3ee",
    flow:    "#4ade80",
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Anomalies</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          Layer divergence, volume spikes, and detected signals — things Robinhood won't surface.
        </p>
      </div>

      {/* Layer divergence */}
      <section className="mb-8">
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          Layer divergence — 5d vs basket
        </div>
        {divergentLayers.length === 0 ? (
          <div className="text-text-muted py-6 text-center" style={{ fontSize: 13 }}>
            No significant layer divergence detected (basket median: {formatPercent(basketMedian, 1)}%).
          </div>
        ) : (
          <div className="space-y-2">
            {divergentLayers.map(({ layer, median5d, z }) => {
              const color = LAYER_COLORS[layer.id] ?? "#71717a"
              const barWidth = Math.min(Math.abs(z) * 15, 100)
              return (
                <div key={layer.id} className="rounded-xl border border-border bg-bg-card px-4 py-3 flex items-center gap-4">
                  <div className="flex items-center gap-2" style={{ width: 140 }}>
                    <span className="rounded-sm shrink-0" style={{ width: 4, height: 16, background: color }} />
                    <span className="text-text-secondary" style={{ fontSize: 13 }}>{layer.name}</span>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-full overflow-hidden" style={{ height: 4, background: "#1f2127" }}>
                      <div
                        className="rounded-full h-full"
                        style={{
                          width: `${barWidth}%`,
                          background: median5d >= 0 ? "#4ade80" : "#f87171",
                          marginLeft: median5d < 0 ? `${100 - barWidth}%` : 0,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0" style={{ width: 80 }}>
                    <span className="font-mono font-semibold" style={{ fontSize: 13, color: median5d >= 0 ? "#4ade80" : "#f87171" }}>
                      {formatPercent(median5d, 1)}%
                    </span>
                    <span className="text-text-muted ml-1" style={{ fontSize: 11 }}>5d</span>
                  </div>
                  <div className="shrink-0 font-mono" style={{ width: 64, fontSize: 12, color: zScoreColor(z), textAlign: "right" }}>
                    z={z.toFixed(1)}
                  </div>
                </div>
              )
            })}
            <p className="text-text-muted mt-2" style={{ fontSize: 11 }}>
              Basket median: {formatPercent(basketMedian, 1)}%  ·  std: {formatPercent(basketStd, 1)}%
            </p>
          </div>
        )}
      </section>

      {/* Volume spikes */}
      <section className="mb-8">
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          Volume spikes — today vs 30d average
        </div>
        {volumeSpikes.length === 0 ? (
          <div className="text-text-muted py-6 text-center" style={{ fontSize: 13 }}>
            No volume spikes detected today (threshold: 2σ above 30d average).
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-x-auto bg-bg-card">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-border" style={{ background: "#111217" }}>
                  <th className="text-left px-4 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>Symbol</th>
                  <th className="text-right px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>Today vol</th>
                  <th className="text-right px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>30d avg</th>
                  <th className="text-right px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>×avg</th>
                  <th className="text-right px-4 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>z-score</th>
                </tr>
              </thead>
              <tbody>
                {volumeSpikes.map((s, i) => (
                  <tr key={s.symbol} className="border-b border-border" style={{ background: i % 2 === 0 ? "#0a0b0e" : "#111217" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm shrink-0" style={{ width: 4, height: 14, background: LAYER_COLORS[s.layer] ?? "#71717a" }} />
                        <a href={`/ticker/${s.symbol}`} className="font-mono font-semibold hover:text-accent transition-colors" style={{ fontSize: 13, color: "#f0a24e" }}>
                          {s.symbol}
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#e8e9ec" }}>
                      {(s.todayVol / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#9ca3af" }}>
                      {(s.avgVol / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#e8e9ec" }}>
                      {(s.todayVol / s.avgVol).toFixed(1)}×
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold" style={{ fontSize: 12, color: zScoreColor(s.z) }}>
                      {s.z.toFixed(1)}σ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Signal feed from insights table */}
      {insights.data && insights.data.length > 0 && (
        <section>
          <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
            Detected signals
          </div>
          <div className="space-y-2">
            {insights.data.map(ins => (
              <div key={ins.id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono uppercase"
                    style={{ fontSize: 10, fontWeight: 700, background: "#16171c", color: kindColor[ins.kind] ?? "#71717a" }}
                  >
                    {ins.kind}
                  </span>
                  <span className="text-text font-medium" style={{ fontSize: 13 }}>{ins.title}</span>
                  <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 11 }}>
                    {new Date(ins.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-text-secondary line-clamp-3" style={{ fontSize: 12, lineHeight: 1.6 }}>
                  {stripMarkdown(ins.body)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
