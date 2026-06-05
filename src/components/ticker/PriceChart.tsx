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
  symbolCloses: ClosePoint[]
  yahooSymbol?: string
}

const YTD_START = `${new Date().getFullYear()}-01-01`

function trimToYTD(closes: ClosePoint[]): ClosePoint[] {
  const filtered = closes.filter(c => c.date >= YTD_START)
  if (filtered.length && filtered[0].date > YTD_START) {
    const prev = closes.filter(c => c.date < YTD_START).pop()
    if (prev) return [prev, ...filtered]
  }
  return filtered
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
  const chartData = useMemo(() => {
    const trimmed = trimToYTD(symbolCloses)
    if (!trimmed.length) return []
    const base = trimmed[0].close
    return trimmed
      .filter(c => c.date >= YTD_START)
      .map(c => ({
        date: c.date,
        pct: parseFloat(((c.close / base - 1) * 100).toFixed(2)),
      }))
  }, [symbolCloses])

  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol ?? symbol)}`

  // Color the line based on whether YTD is positive or negative
  const lastVal = chartData[chartData.length - 1]?.pct ?? 0
  const lineColor = lastVal >= 0 ? "#4ade80" : "#f87171"

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted font-mono" style={{ fontSize: 10 }}>
          YTD return %
          {lastVal !== 0 && (
            <span style={{ marginLeft: 8, color: lastVal >= 0 ? "#4ade80" : "#f87171" }}>
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

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
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
            activeDot={{ r: 3, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
