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
  ReferenceLine,
} from "recharts"

export interface ClosePoint {
  date: string
  close: number
}

interface Props {
  symbol: string
  symbolCloses: ClosePoint[]   // ASC sorted (oldest first)
  yahooSymbol?: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val: number = payload[0]?.value ?? 0
  return (
    <div
      className="border border-border rounded"
      style={{ background: "#111217", padding: "8px 12px", fontSize: 11 }}
    >
      <div className="text-text-muted mb-1">{formatDate(label)}</div>
      <div className="font-mono" style={{ color: val >= 0 ? "#4ade80" : "#f87171" }}>
        {val >= 0 ? "+" : ""}{val.toFixed(2)}%
      </div>
    </div>
  )
}

export default function PriceChart({ symbol, symbolCloses, yahooSymbol }: Props) {
  const { chartData, lastVal } = useMemo(() => {
    const ytdStart = `${new Date().getFullYear()}-01-01`

    // Find the last close before Jan 1 as the YTD base
    const preYTD = symbolCloses.filter(c => c.date < ytdStart)
    const ytdCloses = symbolCloses.filter(c => c.date >= ytdStart)

    if (!ytdCloses.length) return { chartData: [], lastVal: 0 }

    // Use last pre-YTD close as base; fall back to first YTD close
    const base = preYTD.length ? preYTD[preYTD.length - 1].close : ytdCloses[0].close

    const data = ytdCloses.map(c => ({
      date: c.date,
      pct: parseFloat(((c.close / base - 1) * 100).toFixed(2)),
    }))

    return { chartData: data, lastVal: data[data.length - 1]?.pct ?? 0 }
  }, [symbolCloses])

  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol ?? symbol)}`
  const lineColor = lastVal >= 0 ? "#4ade80" : "#f87171"

  // Explicit domain with padding so the line is never clipped
  const pcts = chartData.map(d => d.pct)
  const minPct = pcts.length ? Math.min(...pcts) : -5
  const maxPct = pcts.length ? Math.max(...pcts) : 5
  const pad = Math.max(2, (maxPct - minPct) * 0.1)
  const domain: [number, number] = [
    parseFloat((minPct - pad).toFixed(1)),
    parseFloat((maxPct + pad).toFixed(1)),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted font-mono" style={{ fontSize: 10 }}>
          YTD return %
          {chartData.length > 0 && (
            <span style={{ marginLeft: 8, color: lineColor }}>
              {lastVal >= 0 ? "+" : ""}{lastVal.toFixed(1)}%
            </span>
          )}
        </span>
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

      {chartData.length === 0 ? (
        <div className="text-text-muted text-center py-12" style={{ fontSize: 12 }}>
          No YTD data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2127" vertical={false} />
            <ReferenceLine y={0} stroke="#2a2c33" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "Menlo, ui-monospace, monospace" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={formatMonth}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "Menlo, ui-monospace, monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="pct"
              name={symbol}
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 3, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
