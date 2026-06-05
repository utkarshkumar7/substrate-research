import { createClient } from "@/lib/supabase/server"
import { fetchableSymbols, layersInOrder, tickersByLayer } from "@/lib/topology"
import { getPriceMatrix, pearsonReturns, findDecoupledPairs } from "@/lib/queries/correlations"
import { formatPercent } from "@/lib/format"

export const metadata = { title: "Correlations" }

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

function corrColor(r: number): string {
  if (r >= 0.7)  return "rgba(74,222,128,0.25)"   // strong positive
  if (r >= 0.4)  return "rgba(74,222,128,0.12)"
  if (r >= 0.1)  return "rgba(113,113,122,0.08)"
  if (r >= -0.1) return "rgba(113,113,122,0.04)"
  if (r >= -0.4) return "rgba(248,113,113,0.12)"
  return "rgba(248,113,113,0.25)"                  // strong negative
}

function corrText(r: number): string {
  if (Math.abs(r) >= 0.7) return "#e8e9ec"
  if (Math.abs(r) >= 0.4) return "#9ca3af"
  return "#6b7280"
}

export default async function CorrelationsPage() {
  const client = createClient()
  const symbols = fetchableSymbols()
  const layers = layersInOrder()

  const matrix = await getPriceMatrix(client, symbols, 100)

  // Build symbol → layer map
  const symbolLayer: Record<string, string> = {}
  for (const layer of layers) {
    for (const t of tickersByLayer(layer.id)) {
      symbolLayer[t.symbol] = layer.id
    }
  }

  // Layer-to-layer correlation matrix (median of pairwise correlations, 90d)
  const layerCorr: Record<string, Record<string, number | null>> = {}
  for (const la of layers) {
    layerCorr[la.id] = {}
    const symsA = tickersByLayer(la.id).map(t => t.symbol).filter(s => matrix[s])
    for (const lb of layers) {
      const symsB = tickersByLayer(lb.id).map(t => t.symbol).filter(s => matrix[s])
      const corrs: number[] = []
      for (const sa of symsA) {
        for (const sb of symsB) {
          if (sa === sb) continue
          const r = pearsonReturns(matrix[sa], matrix[sb], 90)
          if (r != null) corrs.push(r)
        }
      }
      layerCorr[la.id][lb.id] = corrs.length ? corrs.reduce((a, b) => a + b, 0) / corrs.length : null
    }
  }

  // Decoupled pairs
  const decoupled = findDecoupledPairs(matrix, symbolLayer, 90, 5, 0.4, 15)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Correlations</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          Layer-to-layer correlation (90d) and pairs that have recently decoupled.
        </p>
      </div>

      {/* Layer correlation matrix */}
      <div className="mb-8">
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          Layer correlation matrix — 90d
        </div>
        <div className="rounded-xl border border-border overflow-x-auto bg-bg-card">
          <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
            <thead>
              <tr>
                <th className="px-3 py-2" style={{ width: 100 }} />
                {layers.map(l => (
                  <th key={l.id} className="px-2 py-2 text-center" style={{ minWidth: 56 }}>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono"
                      style={{ fontSize: 9, fontWeight: 700, color: LAYER_COLORS[l.id] ?? "#71717a", background: "#16171c" }}
                    >
                      {l.id.toUpperCase().slice(0, 4)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layers.map(la => (
                <tr key={la.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm shrink-0" style={{ width: 3, height: 12, background: LAYER_COLORS[la.id] ?? "#71717a" }} />
                      <span className="text-text-secondary" style={{ fontSize: 11 }}>{la.name}</span>
                    </div>
                  </td>
                  {layers.map(lb => {
                    const r = layerCorr[la.id][lb.id]
                    const isDiag = la.id === lb.id
                    return (
                      <td
                        key={lb.id}
                        className="text-center font-mono"
                        style={{
                          fontSize: 11,
                          padding: "6px 4px",
                          background: isDiag ? "#16171c" : (r != null ? corrColor(r) : "transparent"),
                          color: isDiag ? "#4b5563" : (r != null ? corrText(r) : "#4b5563"),
                        }}
                      >
                        {isDiag ? "—" : (r != null ? r.toFixed(2) : "·")}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-2" style={{ fontSize: 10 }}>
          {[
            { color: "rgba(74,222,128,0.35)", label: "Strong positive (≥0.7)" },
            { color: "rgba(74,222,128,0.18)", label: "Moderate (0.4–0.7)" },
            { color: "rgba(248,113,113,0.18)", label: "Moderate negative" },
            { color: "rgba(248,113,113,0.35)", label: "Strong negative (≤−0.4)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1 text-text-muted">
              <span className="rounded-sm" style={{ width: 10, height: 10, background: color, border: "1px solid #2a2c33", display: "inline-block" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Decoupled pairs */}
      <div>
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          Recently decoupled pairs — 5d vs 90d correlation
        </div>
        {decoupled.length === 0 ? (
          <div className="text-text-muted text-center py-10" style={{ fontSize: 13 }}>
            No significant decoupling detected. Need more price history.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-x-auto bg-bg-card">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-border" style={{ background: "#111217" }}>
                  <th className="text-left px-4 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>Pair</th>
                  <th className="text-left px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>Layers</th>
                  <th className="text-right px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>90d corr</th>
                  <th className="text-right px-3 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>5d corr</th>
                  <th className="text-right px-4 py-3 text-text-muted" style={{ fontSize: 11, fontWeight: 500 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {decoupled.map((pair, i) => {
                  const diverging = pair.delta < 0 && pair.corr90d > 0
                  const converging = pair.delta > 0 && pair.corr90d > 0
                  const deltaColor = Math.abs(pair.delta) > 0.5
                    ? (diverging ? "#f87171" : "#4ade80")
                    : "#9ca3af"
                  return (
                    <tr
                      key={`${pair.sym1}-${pair.sym2}`}
                      className="border-b border-border"
                      style={{ background: i % 2 === 0 ? "#0a0b0e" : "#111217" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a href={`/ticker/${pair.sym1}`} className="font-mono font-semibold hover:text-accent transition-colors" style={{ fontSize: 13, color: "#a78bfa" }}>{pair.sym1}</a>
                          <span className="text-text-muted" style={{ fontSize: 11 }}>×</span>
                          <a href={`/ticker/${pair.sym2}`} className="font-mono font-semibold hover:text-accent transition-colors" style={{ fontSize: 13, color: "#a78bfa" }}>{pair.sym2}</a>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <span className="rounded-sm" style={{ width: 6, height: 6, background: LAYER_COLORS[pair.layer1] ?? "#71717a", display: "inline-block" }} />
                          <span className="text-text-muted" style={{ fontSize: 11 }}>{pair.layer1}</span>
                          {pair.layer1 !== pair.layer2 && (
                            <>
                              <span className="text-text-muted" style={{ fontSize: 10 }}>→</span>
                              <span className="rounded-sm" style={{ width: 6, height: 6, background: LAYER_COLORS[pair.layer2] ?? "#71717a", display: "inline-block" }} />
                              <span className="text-text-muted" style={{ fontSize: 11 }}>{pair.layer2}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#9ca3af" }}>
                        {pair.corr90d.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: pair.corr5d >= 0 ? "#4ade80" : "#f87171" }}>
                        {pair.corr5d.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold" style={{ fontSize: 12, color: deltaColor }}>
                        {pair.delta > 0 ? "+" : ""}{pair.delta.toFixed(2)}
                        <span className="text-text-muted ml-1.5" style={{ fontSize: 10, fontWeight: 400 }}>
                          {diverging ? "diverging" : converging ? "converging" : ""}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
