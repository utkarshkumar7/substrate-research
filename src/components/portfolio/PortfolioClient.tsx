"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatPercent } from "@/lib/format"
import HoldingForm from "./HoldingForm"
import PortfolioDonut, { type LayerSlice } from "./PortfolioDonut"
import PortfolioStats from "./PortfolioStats"

export interface PortfolioHolding {
  symbol: string
  name: string
  layer: string
  layerLabel: string
  layerColor: string
  shares: number
  costBasis: number | null
  notes: string | null
  latestPrice: number | null
  currentValue: number
  pnlPct: number | null
  pnlAbs: number | null
}

interface Props {
  holdings: PortfolioHolding[]
  slices: LayerSlice[]
  totalValue: number
  totalCost: number | null
  totalPnl: number | null
  totalPnlPct: number | null
}

export default function PortfolioClient({ holdings: initialHoldings, slices: initialSlices, totalValue, totalCost, totalPnl, totalPnlPct }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<PortfolioHolding | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleDelete(symbol: string) {
    const client = createClient()
    await client.from("holdings").delete().eq("symbol", symbol)
    setConfirmDelete(null)
    refresh()
  }

  return (
    <div>
      {/* Stats */}
      <PortfolioStats
        totalValue={totalValue}
        totalCost={totalCost}
        totalPnl={totalPnl}
        totalPnlPct={totalPnlPct}
      />

      <div className="grid gap-6 mt-6" style={{ gridTemplateColumns: "1fr 360px" }}>
        {/* Holdings Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-text" style={{ fontSize: 13 }}>Positions</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditTarget(null); setShowForm(true) }}
                className="flex items-center gap-1.5 rounded-lg border border-border hover:border-border-strong text-text-secondary hover:text-text transition-colors"
                style={{ fontSize: 12, padding: "5px 10px" }}
              >
                <Plus size={13} />
                Add
              </button>
              <button
                onClick={() => {
                  const q = encodeURIComponent(
                    "Restructure my portfolio. Review my current holdings and suggest 3 candidate allocations across the supply chain layers with different risk/conviction profiles."
                  )
                  router.push(`/ask?q=${q}`)
                }}
                className="flex items-center gap-1.5 rounded-lg border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
                style={{ fontSize: 12, padding: "5px 10px" }}
              >
                <RefreshCw size={13} />
                Restructure
              </button>
            </div>
          </div>

          {initialHoldings.length === 0 ? (
            <div
              className="rounded-xl border border-border flex flex-col items-center justify-center text-center"
              style={{ background: "#111217", padding: "48px 24px" }}
            >
              <p className="text-text-muted mb-3" style={{ fontSize: 13 }}>No positions yet</p>
              <button
                onClick={() => { setEditTarget(null); setShowForm(true) }}
                className="flex items-center gap-1.5 rounded-lg text-text-secondary hover:text-accent transition-colors"
                style={{ fontSize: 13 }}
              >
                <Plus size={14} />
                Add your first position
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#111217" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Ticker", "Shares", "Price", "Value", "P&L", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left text-text-muted"
                        style={{ fontSize: 10, fontWeight: 500, padding: "9px 14px", letterSpacing: "0.05em" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialHoldings.map((h) => (
                    <tr
                      key={h.symbol}
                      className="border-b border-border last:border-0 hover:bg-bg-hover transition-colors"
                    >
                      {/* Ticker */}
                      <td style={{ padding: "10px 14px" }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="rounded-full shrink-0"
                            style={{ width: 3, height: 20, borderRadius: 2, background: h.layerColor }}
                          />
                          <div>
                            <a
                              href={`/ticker/${h.symbol}`}
                              className="font-semibold text-text hover:text-accent transition-colors"
                              style={{ fontSize: 13 }}
                            >
                              {h.symbol}
                            </a>
                            <div className="text-text-muted" style={{ fontSize: 10 }}>{h.layerLabel}</div>
                          </div>
                        </div>
                      </td>
                      {/* Shares */}
                      <td className="font-mono text-text-secondary" style={{ fontSize: 12, padding: "10px 14px" }}>
                        {h.shares % 1 === 0 ? h.shares.toFixed(0) : h.shares.toFixed(3)}
                      </td>
                      {/* Price */}
                      <td className="font-mono text-text-secondary" style={{ fontSize: 12, padding: "10px 14px" }}>
                        {h.latestPrice != null ? `$${h.latestPrice.toFixed(2)}` : "—"}
                      </td>
                      {/* Value */}
                      <td className="font-mono font-semibold text-text" style={{ fontSize: 12, padding: "10px 14px" }}>
                        {h.currentValue > 0 ? formatCurrency(h.currentValue) : "—"}
                      </td>
                      {/* P&L */}
                      <td style={{ padding: "10px 14px" }}>
                        {h.pnlPct != null ? (
                          <div>
                            <div
                              className="font-mono"
                              style={{ fontSize: 12, color: h.pnlPct >= 0 ? "#4ade80" : "#f87171" }}
                            >
                              {formatPercent(h.pnlPct)}%
                            </div>
                            {h.pnlAbs != null && (
                              <div
                                className="font-mono"
                                style={{ fontSize: 10, color: h.pnlAbs >= 0 ? "#4ade80" : "#f87171" }}
                              >
                                {h.pnlAbs >= 0 ? "+" : "-"}{formatCurrency(Math.abs(h.pnlAbs))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted" style={{ fontSize: 11 }}>no cost</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        {confirmDelete === h.symbol ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(h.symbol)}
                              className="text-down hover:opacity-80 transition-opacity"
                              style={{ fontSize: 11 }}
                            >
                              Confirm
                            </button>
                            <span className="text-text-muted" style={{ fontSize: 11 }}>/</span>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-text-muted hover:text-text transition-colors"
                              style={{ fontSize: 11 }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                            <button
                              onClick={() => { setEditTarget(h); setShowForm(true) }}
                              className="text-text-muted hover:text-text transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(h.symbol)}
                              className="text-text-muted hover:text-down transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Donut */}
        <div>
          <div className="font-semibold text-text mb-3" style={{ fontSize: 13 }}>Layer Allocation</div>
          <div
            className="rounded-xl border border-border"
            style={{ background: "#111217", padding: "20px" }}
          >
            <PortfolioDonut slices={initialSlices} />
          </div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <HoldingForm
          initial={
            editTarget
              ? {
                  symbol: editTarget.symbol,
                  shares: editTarget.shares,
                  cost_basis: editTarget.costBasis,
                  notes: editTarget.notes,
                }
              : undefined
          }
          onSaved={() => { setShowForm(false); setEditTarget(null); refresh() }}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
