import { topology, layersInOrder, tickersByLayer } from "@/lib/topology"

export const metadata = { title: "Topology" }

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

export default function TopologyPage() {
  const layers = layersInOrder()

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Topology</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          {layers.length} layers · {topology.tickers.length} tickers · {topology.edges.length} supply chain edges.{" "}
          Edit <code className="font-mono text-accent" style={{ fontSize: 12 }}>topology.yaml</code> to add or modify.
        </p>
      </div>

      <div className="space-y-4">
        {layers.map(layer => {
          const tickers = tickersByLayer(layer.id)
          const color = LAYER_COLORS[layer.id] ?? "#71717a"
          return (
            <div key={layer.id} className="rounded-xl border border-border bg-bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border" style={{ background: "#111217" }}>
                <span className="rounded-sm shrink-0" style={{ width: 4, height: 18, background: color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-text font-medium" style={{ fontSize: 13 }}>{layer.name}</span>
                  <span className="text-text-muted ml-2" style={{ fontSize: 11 }}>{layer.description}</span>
                </div>
                <span className="text-text-muted font-mono shrink-0" style={{ fontSize: 11 }}>
                  {tickers.length} tickers
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {tickers.map(t => (
                  <a
                    key={t.symbol}
                    href={`/ticker/${t.symbol}`}
                    className="rounded border border-border hover:border-border-strong transition-colors"
                    style={{ background: "#16171c", padding: "4px 10px" }}
                  >
                    <span className="font-mono text-text-secondary hover:text-text transition-colors" style={{ fontSize: 12 }}>
                      {t.symbol}
                    </span>
                    {t.needsVerification && (
                      <span className="text-text-muted ml-1" style={{ fontSize: 10 }}>⚠</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
