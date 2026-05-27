import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { fetchableSymbols, layersInOrder, tickersByLayer } from "@/lib/topology"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import { pctForPeriod } from "@/lib/analytics/performance"
import { formatPercent } from "@/lib/format"
import InsightList from "@/components/insights/InsightList"
import HoldingsList from "@/components/portfolio/HoldingsList"
import MacroStrip from "@/components/shell/MacroStrip"

// ─── Layer health ─────────────────────────────────────────────────────────────

function meanPct(values: (number | null)[]): number {
  const nums = values.filter((v): v is number => v != null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

async function LayerHealthPanel() {
  const client = createClient()
  const snapshots = await getHeatmapSnapshot(client, fetchableSymbols())

  const layers = layersInOrder()
  const scores = layers
    .map((layer) => {
      const syms = tickersByLayer(layer.id)
        .filter((t) => !t.needsVerification)
        .map((t) => t.symbol)
      const pcts = syms.map((s) => pctForPeriod(snapshots[s] ?? {} as never, "5d"))
      return { layer, score: meanPct(pcts) }
    })
    .sort((a, b) => b.score - a.score)

  const maxAbs = Math.max(...scores.map((s) => Math.abs(s.score)), 0.1)

  return (
    <div className="space-y-1.5">
      {scores.map(({ layer, score }) => {
        const pctColor = score > 0.5 ? "#4ade80" : score < -0.5 ? "#f87171" : "#71717a"
        const barPct = Math.min(100, (Math.abs(score) / maxAbs) * 100)

        return (
          <div key={layer.id} className="flex items-center gap-2">
            {/* Layer dot */}
            <span
              className="shrink-0 rounded-full"
              style={{ width: 6, height: 6, background: layer.color }}
            />
            {/* Layer name */}
            <span
              className="text-text-secondary shrink-0"
              style={{ fontSize: 10, width: 68 }}
            >
              {SHORT[layer.id] ?? layer.name}
            </span>
            {/* Bar */}
            <div
              className="flex-1 rounded-full bg-bg"
              style={{ height: 3, position: "relative" }}
            >
              <div
                className="rounded-full"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${barPct}%`,
                  background: pctColor,
                  opacity: 0.8,
                }}
              />
            </div>
            {/* Score */}
            <span
              className="font-mono shrink-0"
              style={{ fontSize: 10, width: 44, textAlign: "right", color: pctColor }}
            >
              {formatPercent(score, 1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div
        className="text-text-muted uppercase tracking-wider mb-2"
        style={{ fontSize: 10, letterSpacing: "0.07em" }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function RailSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 rounded bg-bg-hover" />
      ))}
    </div>
  )
}

// ─── Short layer names (same map as pipeline) ─────────────────────────────────

const SHORT: Record<string, string> = {
  raw_materials:    "Raw Materials",
  energy:           "Energy",
  storage_batteries:"Storage",
  foundries_memory: "Foundries",
  chip_design:      "Chip Design",
  quantum:          "Quantum",
  photonics:        "Photonics",
  datacenter_infra: "Datacenter",
  applications:     "Applications",
}

// ─── RightRail ────────────────────────────────────────────────────────────────

export default function RightRail() {
  return (
    <aside
      className="bg-bg-card border-l border-border overflow-y-auto flex-shrink-0"
      style={{ width: 280, padding: "20px 16px" }}
    >
      <Section title="Macro">
        <Suspense fallback={<RailSkeleton />}>
          <MacroStrip />
        </Suspense>
      </Section>

      <div className="border-t border-border mb-5" />

      <Section title="Layer Health (5d)">
        <Suspense fallback={<RailSkeleton />}>
          <LayerHealthPanel />
        </Suspense>
      </Section>

      <div className="border-t border-border mb-5" />

      <Section title="Intelligence">
        <Suspense fallback={<RailSkeleton />}>
          <InsightList />
        </Suspense>
      </Section>

      <div className="border-t border-border mb-5" />

      <Section title="Holdings">
        <Suspense fallback={<RailSkeleton />}>
          <HoldingsList />
        </Suspense>
      </Section>
    </aside>
  )
}
