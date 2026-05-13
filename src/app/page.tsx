import { createClient } from "@/lib/supabase/server"
import { fetchableSymbols, layersInOrder, tickersByLayer } from "@/lib/topology"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import { medianPct } from "@/lib/analytics/performance"
import { formatPercent } from "@/lib/format"
import PipelineGraph from "@/components/pipeline/PipelineGraph"
import HeatmapGrid from "@/components/heatmap/HeatmapGrid"

const SHORT: Record<string, string> = {
  raw_materials:    "Raw Materials",
  energy:           "Energy",
  storage_batteries:"Storage",
  foundries_memory: "Foundries",
  chip_design:      "Chip Design",
  quantum:          "Quantum",
  datacenter_infra: "Datacenter",
  applications:     "Applications",
}

export default async function HomePage() {
  const client = createClient()
  const symbols = [...fetchableSymbols(), "SPY"]
  const snapshots = await getHeatmapSnapshot(client, symbols)

  const layers = layersInOrder()

  const layerScores = layers
    .map(layer => {
      const syms = tickersByLayer(layer.id)
        .filter(t => !t.needsVerification)
        .map(t => t.symbol)
      const score = medianPct(syms.map(s => snapshots[s]?.pct5d ?? null))
      return { layer, score }
    })
    .sort((a, b) => b.score - a.score)

  const hottest = layerScores[0]
  const coldest = layerScores[layerScores.length - 1]

  const basketPct = medianPct(fetchableSymbols().map(s => snapshots[s]?.pct5d ?? null))
  const spyPct = snapshots["SPY"]?.pct5d ?? null
  const vsSpy = spyPct != null ? basketPct - spyPct : null

  return (
    <div className="p-6">
      {/* Metric cards */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <MetricCard
          label="Basket vs SPY (5d)"
          value={vsSpy != null ? formatPercent(vsSpy) + "%" : "—"}
          valueColor={vsSpy == null ? undefined : vsSpy >= 0 ? "#4ade80" : "#f87171"}
          sub={spyPct != null ? `SPY ${formatPercent(spyPct)}%` : undefined}
        />
        <MetricCard
          label="Hottest layer (5d)"
          value={hottest ? (SHORT[hottest.layer.id] ?? hottest.layer.name) : "—"}
          valueColor="#4ade80"
          sub={hottest ? formatPercent(hottest.score) + "%" : undefined}
          subColor="#4ade80"
        />
        <MetricCard
          label="Coldest layer (5d)"
          value={coldest ? (SHORT[coldest.layer.id] ?? coldest.layer.name) : "—"}
          valueColor={coldest && coldest.score < 0 ? "#f87171" : undefined}
          sub={coldest ? formatPercent(coldest.score) + "%" : undefined}
          subColor={coldest && coldest.score < 0 ? "#f87171" : "#71717a"}
        />
        <MetricCard
          label="Open anomalies"
          value="—"
          sub="Phase 7"
        />
      </div>

      {/* Pipeline graph */}
      <div className="bg-bg-card border border-border rounded-xl mb-4" style={{ padding: "18px 20px" }}>
        <div className="flex items-baseline gap-2 mb-4">
          <div className="font-semibold tracking-tight" style={{ fontSize: 14 }}>
            AI supply chain pipeline
          </div>
          <div className="text-text-muted" style={{ fontSize: 12 }}>
            Silicon → chatbot
          </div>
        </div>
        <PipelineGraph snapshots={snapshots} />
      </div>

      {/* Heatmap teaser */}
      <div className="bg-bg-card border border-border rounded-xl" style={{ padding: "18px 20px" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold tracking-tight" style={{ fontSize: 14 }}>
            Layer heatmap
          </div>
          <a
            href="/heatmap"
            className="text-accent hover:opacity-80 transition-opacity"
            style={{ fontSize: 12 }}
          >
            Full view →
          </a>
        </div>
        <HeatmapGrid />
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  valueColor,
  sub,
  subColor,
}: {
  label: string
  value: string
  valueColor?: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-bg-card border border-border rounded-xl" style={{ padding: "14px 16px" }}>
      <div
        className="text-text-muted uppercase tracking-wider mb-2"
        style={{ fontSize: 10 }}
      >
        {label}
      </div>
      <div
        className="font-semibold tracking-tight truncate"
        style={{ fontSize: 16, color: valueColor ?? "#e8e9ec" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-mono mt-0.5"
          style={{ fontSize: 11, color: subColor ?? "#6b7280" }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
