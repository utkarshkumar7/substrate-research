import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTicker, getLayer } from "@/lib/topology"
import { getPriceHistory } from "@/lib/queries/ticker"
import { buildSnapshot } from "@/lib/analytics/performance"
import { rsi14, beta } from "@/lib/analytics/correlations"
import PriceChart from "@/components/ticker/PriceChart"
import TickerStats from "@/components/ticker/TickerStats"
import UpstreamDownstream from "@/components/ticker/UpstreamDownstream"
import ClaudeTake from "@/components/ticker/ClaudeTake"

// ─── Benchmark per layer ──────────────────────────────────────────────────────

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-bg-hover" style={{ width: `${60 + (i % 3) * 15}%` }} />
      ))}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl" style={{ padding: "20px 24px" }}>
      {title && (
        <div className="text-text-muted uppercase tracking-wider mb-4" style={{ fontSize: 10 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()

  const ticker = getTicker(upper)
  if (!ticker) notFound()

  const layer = getLayer(ticker.layer)
  const client = createClient()
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const since = twoYearsAgo.toISOString().slice(0, 10)

  const history = await getPriceHistory(client, [upper, "SPY"], since)

  const symbolCloses = history[upper] ?? []
  const spyCloses = history["SPY"] ?? []

  // Snapshot (DESC sorted)
  const descCloses = [...symbolCloses].reverse()
  const snap = buildSnapshot(descCloses)

  // RSI from ASC closes
  const rsiVal = rsi14(symbolCloses.map((c) => c.close))

  // Beta vs SPY (both ASC)
  const betaVal = beta(
    symbolCloses.map((c) => c.close),
    spyCloses.map((c) => c.close)
  )

  // 52w range
  const year = symbolCloses.slice(-252)
  const high52w = year.length ? Math.max(...year.map((c) => c.close)) : null
  const low52w  = year.length ? Math.min(...year.map((c) => c.close)) : null

  return (
    <div className="max-w-4xl mx-auto" style={{ padding: "28px 32px" }}>
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {layer && (
              <span
                className="rounded-full"
                style={{ width: 8, height: 8, background: layer.color, display: "inline-block" }}
              />
            )}
            <h1
              className="font-semibold tracking-tight text-text"
              style={{ fontSize: 26 }}
            >
              {upper}
            </h1>
            {snap && (
              <span
                className="font-mono font-semibold"
                style={{
                  fontSize: 20,
                  color: snap.pct1d != null && snap.pct1d >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {snap.pct1d != null
                  ? (snap.pct1d >= 0 ? "+" : "") + snap.pct1d.toFixed(2) + "%"
                  : ""}
              </span>
            )}
          </div>
          <div className="text-text-secondary" style={{ fontSize: 14 }}>
            {ticker.name}
          </div>
          {layer && (
            <div className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
              {layer.name}
              {ticker.subcategory && (
                <span className="ml-2 text-text-muted" style={{ opacity: 0.7 }}>
                  · {ticker.subcategory}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          {snap && (
            <div className="font-mono font-semibold text-text" style={{ fontSize: 22 }}>
              ${snap.latest.toFixed(2)}
            </div>
          )}
          {snap && (
            <div className="text-text-muted font-mono" style={{ fontSize: 11 }}>
              {snap.latestDate}
            </div>
          )}
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="flex flex-col gap-4">
        {/* Chart */}
        <Card title="Price Performance">
          {symbolCloses.length > 0 ? (
            <PriceChart
              symbol={upper}
              symbolCloses={symbolCloses}
            />
          ) : (
            <p className="text-text-muted" style={{ fontSize: 12 }}>
              No price data available.
            </p>
          )}
        </Card>

        {/* Stats */}
        {snap && (
          <Card title="Key Stats">
            <TickerStats
              latestPrice={snap.latest}
              high52w={high52w}
              low52w={low52w}
              pct1d={snap.pct1d}
              pct5d={snap.pct5d}
              pct1m={snap.pct1m}
              pctYtd={snap.pctYtd}
              rsi={rsiVal}
              betaVsSpy={betaVal}
            />
          </Card>
        )}

        {/* Supply chain context */}
        <Card title="Supply Chain Context">
          <UpstreamDownstream symbol={upper} />
        </Card>

        {/* Claude's Take */}
        <Card title="Claude's Take">
          <Suspense fallback={<Skeleton rows={3} />}>
            <ClaudeTake
              symbol={upper}
              name={ticker.name}
              layerName={layer?.name ?? ticker.layer}
              pct1d={snap?.pct1d ?? null}
              pct5d={snap?.pct5d ?? null}
              pct1m={snap?.pct1m ?? null}
              pctYtd={snap?.pctYtd ?? null}
              rsi={rsiVal}
              betaVsSpy={betaVal}
            />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}
