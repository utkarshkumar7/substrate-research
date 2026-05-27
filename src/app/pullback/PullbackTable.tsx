"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { PullbackMetrics } from "@/lib/analytics/pullback"
import { formatPercent } from "@/lib/format"

type SortKey = "pctFrom52wHigh" | "pctFromMa50" | "rsi14" | "ret5d" | "vol30d"

function fmt(v: number | null, digits = 1): string {
  if (v == null) return "—"
  return v.toFixed(digits)
}

function fmtPct(v: number | null): string {
  if (v == null) return "—"
  return formatPercent(v, 1) + "%"
}

function rsiColor(rsi: number | null): string {
  if (rsi == null) return "#71717a"
  if (rsi < 30) return "#f87171"
  if (rsi > 70) return "#4ade80"
  return "#e8e9ec"
}

function pctColor(pct: number | null, invert = false): string {
  if (pct == null) return "#71717a"
  const isPositive = pct >= 0
  const good = invert ? !isPositive : isPositive
  return good ? "#4ade80" : "#f87171"
}

const COLS: { key: SortKey; label: string }[] = [
  { key: "pctFrom52wHigh", label: "% from 52w High" },
  { key: "pctFromMa50",    label: "% from 50d MA"   },
  { key: "rsi14",          label: "RSI(14)"          },
  { key: "ret5d",          label: "5d Return"        },
  { key: "vol30d",         label: "30d Vol"          },
]

interface Props {
  metrics: PullbackMetrics[]
}

export default function PullbackTable({ metrics }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pctFrom52wHigh")
  const [sortAsc, setSortAsc] = useState(true)
  const router = useRouter()

  const sorted = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const av = a[sortKey] ?? (sortAsc ? Infinity : -Infinity)
      const bv = b[sortKey] ?? (sortAsc ? Infinity : -Infinity)
      return sortAsc ? av - bv : bv - av
    })
  }, [metrics, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(key === "pctFrom52wHigh" || key === "pctFromMa50") }
  }

  return (
    <div className="rounded border border-border overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr className="border-b border-border" style={{ background: "#111217" }}>
            <th className="text-left text-text-muted px-4 py-3" style={{ fontSize: 11, fontWeight: 500 }}>
              Symbol
            </th>
            <th className="text-right text-text-muted px-3 py-3" style={{ fontSize: 11, fontWeight: 500 }}>
              Price
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className="text-right px-3 py-3 cursor-pointer select-none"
                style={{ fontSize: 11, fontWeight: sortKey === c.key ? 600 : 500, color: sortKey === c.key ? "#a78bfa" : "#6b7280" }}
                onClick={() => handleSort(c.key)}
              >
                {c.label} {sortKey === c.key ? (sortAsc ? "↑" : "↓") : ""}
              </th>
            ))}
            <th className="px-3 py-3" style={{ fontSize: 11, fontWeight: 500 }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const prompt = m.currentPrice != null && m.pctFrom52wHigh != null && m.rsi14 != null
              ? `Pullback setup on ${m.symbol} — currently $${m.currentPrice.toFixed(2)}, down ${Math.abs(m.pctFrom52wHigh).toFixed(1)}% from 52w high, RSI ${m.rsi14.toFixed(0)}. Worth a closer look at call options? Reference my topology and current holdings.`
              : `Pullback setup on ${m.symbol}. Worth a closer look at call options? Reference my topology and current holdings.`

            return (
              <tr
                key={m.symbol}
                className="border-b border-border hover:bg-bg-hover transition-colors"
                style={{ background: i % 2 === 0 ? "#0a0b0e" : "#111217" }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/ticker/${m.symbol}`}
                    className="font-mono font-semibold hover:text-accent transition-colors"
                    style={{ fontSize: 13, color: "#a78bfa" }}
                  >
                    {m.symbol}
                  </Link>
                  {m.notes && (
                    <div className="text-text-muted mt-0.5" style={{ fontSize: 10 }}>
                      {m.notes}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#e8e9ec" }}>
                  {m.currentPrice != null ? `$${m.currentPrice.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: m.pctFrom52wHigh != null && m.pctFrom52wHigh < -10 ? "#f87171" : "#71717a" }}>
                  {fmtPct(m.pctFrom52wHigh)}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: pctColor(m.pctFromMa50, true) }}>
                  {fmtPct(m.pctFromMa50)}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: rsiColor(m.rsi14) }}>
                  {fmt(m.rsi14, 0)}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: pctColor(m.ret5d) }}>
                  {fmtPct(m.ret5d)}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ fontSize: 12, color: "#9ca3af" }}>
                  {fmt(m.vol30d, 0)}{m.vol30d != null ? "%" : ""}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => router.push(`/ask?q=${encodeURIComponent(prompt)}`)}
                    className="rounded border border-border text-text-muted hover:border-accent hover:text-accent transition-colors"
                    style={{ fontSize: 11, padding: "3px 10px", background: "#16171c", whiteSpace: "nowrap" }}
                  >
                    Ask Claude →
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
