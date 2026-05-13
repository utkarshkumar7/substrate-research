import { upstreamOf, downstreamOf, getTicker, getLayer } from "@/lib/topology"

interface Props {
  symbol: string
}

function TickerChip({ symbol }: { symbol: string }) {
  const t = getTicker(symbol)
  const layer = t ? getLayer(t.layer) : undefined
  return (
    <a
      href={`/ticker/${symbol}`}
      className="inline-flex items-center gap-1.5 rounded border border-border hover:border-border-strong transition-colors"
      style={{
        fontSize: 11,
        padding: "3px 8px",
        textDecoration: "none",
        background: "#16171c",
      }}
    >
      {layer && (
        <span
          className="rounded-full shrink-0"
          style={{ width: 5, height: 5, background: layer.color }}
        />
      )}
      <span className="font-mono font-semibold text-text">{symbol}</span>
      {t && (
        <span className="text-text-muted" style={{ fontSize: 10 }}>
          {t.name.length > 16 ? t.name.slice(0, 15) + "…" : t.name}
        </span>
      )}
    </a>
  )
}

export default function UpstreamDownstream({ symbol }: Props) {
  const upstream = upstreamOf(symbol)
  const downstream = downstreamOf(symbol)

  if (!upstream.length && !downstream.length) return null

  return (
    <div className="space-y-4">
      {upstream.length > 0 && (
        <div>
          <div className="text-text-muted uppercase tracking-wider mb-2" style={{ fontSize: 10 }}>
            Upstream suppliers
          </div>
          <div className="flex flex-wrap gap-2">
            {upstream.map((e) => (
              <TickerChip key={e.from} symbol={e.from} />
            ))}
          </div>
        </div>
      )}
      {downstream.length > 0 && (
        <div>
          <div className="text-text-muted uppercase tracking-wider mb-2" style={{ fontSize: 10 }}>
            Downstream customers
          </div>
          <div className="flex flex-wrap gap-2">
            {downstream.map((e) => (
              <TickerChip key={e.to} symbol={e.to} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
