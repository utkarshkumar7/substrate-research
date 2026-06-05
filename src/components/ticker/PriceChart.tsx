"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export interface ClosePoint {
  date: string
  close: number
}

interface Props {
  symbol: string
  symbolCloses: ClosePoint[]  // ASC sorted
  benchSymbol: string
  benchCloses: ClosePoint[]   // ASC sorted
  yahooSymbol?: string        // override for Yahoo Finance URL (e.g. ^TNX)
}

const YTD_START = `${new Date().getFullYear()}-01-01`

function trimToYTD(closes: ClosePoint[]): ClosePoint[] {
  const filtered = closes.filter(c => c.date >= YTD_START)
  // Always include one point before YTD start as the base for indexing
  if (filtered.length && filtered[0].date > YTD_START) {
    const prev = closes.filter(c => c.date < YTD_START).pop()
    if (prev) return [prev, ...filtered]
  }
  return filtered
}

function normalize(closes: ClosePoint[]): Array<{ date: string; value: number }> {
  if (!closes.length) return []
  const base = closes[0].close
  return closes.map((c) => ({ date: c.date, value: (c.close / base) * 100 }))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatYear(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="border border-border rounded"
      style={{ background: "#111217", padding: "8px 12px", fontSize: 11 }}
    >
      <div className="text-text-muted mb-1">{formatDate(label)}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2 font-mono">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-text">{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PriceChart({ symbol, symbolCloses, benchSymbol, benchCloses, yahooSymbol }: Props) {
  const chartData = useMemo(() => {
    const sTrimmed = trimToYTD(symbolCloses)
    const bTrimmed = trimToYTD(benchCloses)

    const sNorm = normalize(sTrimmed)
    const bNorm = normalize(bTrimmed)

    // Drop the pre-YTD anchor point from chart display (keep only YTD_START and after)
    const sDisplay = sNorm.filter(p => p.date >= YTD_START)
    const bMap = new Map(bNorm.filter(p => p.date >= YTD_START).map((p) => [p.date, p.value]))
    return sDisplay.map((p) => ({
      date: p.date,
      [symbol]: parseFloat(p.value.toFixed(2)),
      [benchSymbol]: parseFloat((bMap.get(p.date) ?? p.value).toFixed(2)),
    }))
  }, [symbol, symbolCloses, benchSymbol, benchCloses])

  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol ?? symbol)}`

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted font-mono" style={{ fontSize: 10 }}>YTD · indexed to 100</span>
        <a
          href={yahooUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent transition-colors font-mono"
          style={{ fontSize: 10 }}
        >
          Yahoo Finance ↗
        </a>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2127" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "Menlo, ui-monospace, monospace" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={formatYear}
            minTickGap={50}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "Menlo, ui-monospace, monospace" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={symbol}
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#a78bfa" }}
          />
          <Line
            type="monotone"
            dataKey={benchSymbol}
            stroke="#4b5563"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 3"
            activeDot={{ r: 3, fill: "#9ca3af" }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-2" style={{ fontSize: 10 }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 16, height: 2, background: "#a78bfa", borderRadius: 1 }} />
          <span className="font-mono text-text-secondary">{symbol}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 16, height: 2, background: "#4b5563", borderRadius: 1 }} />
          <span className="font-mono text-text-muted">{benchSymbol}</span>
        </span>
      </div>
    </div>
  )
}
