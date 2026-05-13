"use client"

import { useState, useMemo } from "react"
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
}

type Period = "1M" | "6M" | "1Y" | "2Y"

const PERIOD_DAYS: Record<Period, number> = {
  "1M":  21,
  "6M": 126,
  "1Y": 252,
  "2Y": 504,
}

function trimToN(closes: ClosePoint[], n: number): ClosePoint[] {
  return closes.slice(-n)
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

export default function PriceChart({ symbol, symbolCloses, benchSymbol, benchCloses }: Props) {
  const [period, setPeriod] = useState<Period>("1Y")

  const chartData = useMemo(() => {
    const n = PERIOD_DAYS[period]
    const sTrimmed = trimToN(symbolCloses, n)
    const bTrimmed = trimToN(benchCloses, n)

    const sNorm = normalize(sTrimmed)
    const bNorm = normalize(bTrimmed)

    // Merge by date
    const bMap = new Map(bNorm.map((p) => [p.date, p.value]))
    return sNorm.map((p) => ({
      date: p.date,
      [symbol]: parseFloat(p.value.toFixed(2)),
      [benchSymbol]: parseFloat((bMap.get(p.date) ?? p.value).toFixed(2)),
    }))
  }, [period, symbol, symbolCloses, benchSymbol, benchCloses])

  const useLongDateFormat = period === "2Y" || period === "1Y"

  return (
    <div>
      {/* Period chips */}
      <div className="flex gap-1 mb-3">
        {(["1M", "6M", "1Y", "2Y"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="rounded font-mono transition-colors"
            style={{
              fontSize: 11,
              padding: "3px 10px",
              background: period === p ? "#a78bfa" : "#1a1b21",
              color: period === p ? "#0a0b0e" : "#9ca3af",
              border: "none",
              cursor: "pointer",
              fontWeight: period === p ? 600 : 400,
            }}
          >
            {p}
          </button>
        ))}
        <span className="ml-auto text-text-muted" style={{ fontSize: 10, alignSelf: "center" }}>
          indexed to 100
        </span>
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
            tickFormatter={useLongDateFormat ? formatYear : formatDate}
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
