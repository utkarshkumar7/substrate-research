"use client"

import { useState, useRef, useEffect } from "react"
import { TOPOLOGY } from "@/lib/topology/topology.generated"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"

interface Props {
  initial?: { symbol: string; shares: number; cost_basis: number | null; notes: string | null }
  onSaved: () => void
  onClose: () => void
}

const ALL_TICKERS = TOPOLOGY.tickers.map((t) => ({
  symbol: t.symbol,
  name: t.name,
  layer: t.layer,
}))

export default function HoldingForm({ initial, onSaved, onClose }: Props) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? "")
  const [shares, setShares] = useState(initial?.shares?.toString() ?? "")
  const [costBasis, setCostBasis] = useState(initial?.cost_basis?.toString() ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [query, setQuery] = useState(initial?.symbol ?? "")
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initial

  const filtered = query
    ? ALL_TICKERS.filter(
        (t) =>
          t.symbol.toUpperCase().startsWith(query.toUpperCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : ALL_TICKERS.slice(0, 8)

  const canSave = symbol.length > 0 && Number(shares) > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    const client = createClient()
    const { error: err } = await client.from("holdings").upsert({
      symbol: symbol.toUpperCase(),
      shares: Number(shares),
      cost_basis: costBasis ? Number(costBasis) : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      onSaved()
    }
  }

  function selectTicker(sym: string) {
    setSymbol(sym)
    setQuery(sym)
    setShowDropdown(false)
  }

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl border border-border-strong w-full"
        style={{ background: "#111217", padding: "24px", maxWidth: 400 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-text" style={{ fontSize: 15 }}>
            {isEdit ? `Edit ${initial!.symbol}` : "Add Position"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Symbol */}
        <div className="mb-4 relative">
          <label className="block text-text-muted mb-1" style={{ fontSize: 11 }}>SYMBOL</label>
          <input
            ref={inputRef}
            disabled={isEdit}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSymbol("")
              setShowDropdown(true)
            }}
            onFocus={() => !isEdit && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="e.g. NVDA"
            className="w-full rounded-lg border border-border bg-bg text-text outline-none focus:border-border-strong transition-colors"
            style={{ fontSize: 13, padding: "8px 10px" }}
          />
          {showDropdown && !isEdit && filtered.length > 0 && (
            <div
              className="absolute z-10 w-full rounded-lg border border-border-strong overflow-hidden"
              style={{ background: "#16171c", top: "100%", marginTop: 4 }}
            >
              {filtered.map((t) => (
                <button
                  key={t.symbol}
                  onMouseDown={() => selectTicker(t.symbol)}
                  className="w-full flex items-center gap-2 text-left hover:bg-bg-hover transition-colors"
                  style={{ padding: "7px 10px" }}
                >
                  <span className="font-semibold text-text font-mono" style={{ fontSize: 12, width: 52 }}>
                    {t.symbol}
                  </span>
                  <span className="text-text-muted flex-1 truncate" style={{ fontSize: 11 }}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shares */}
        <div className="mb-4">
          <label className="block text-text-muted mb-1" style={{ fontSize: 11 }}>SHARES</label>
          <input
            type="number"
            min="0"
            step="any"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="e.g. 100"
            className="w-full rounded-lg border border-border bg-bg text-text outline-none focus:border-border-strong transition-colors font-mono"
            style={{ fontSize: 13, padding: "8px 10px" }}
          />
        </div>

        {/* Cost Basis */}
        <div className="mb-4">
          <label className="block text-text-muted mb-1" style={{ fontSize: 11 }}>
            COST BASIS / SHARE <span className="text-text-muted opacity-60">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: 12 }}>$</span>
            <input
              type="number"
              min="0"
              step="any"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder="avg price paid"
              className="w-full rounded-lg border border-border bg-bg text-text outline-none focus:border-border-strong transition-colors font-mono"
              style={{ fontSize: 13, padding: "8px 10px 8px 22px" }}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-text-muted mb-1" style={{ fontSize: 11 }}>
            NOTES <span className="text-text-muted opacity-60">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="conviction thesis, entry reason…"
            className="w-full rounded-lg border border-border bg-bg text-text outline-none focus:border-border-strong transition-colors"
            style={{ fontSize: 13, padding: "8px 10px" }}
          />
        </div>

        {error && (
          <p className="text-down mb-3" style={{ fontSize: 12 }}>{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border text-text-secondary hover:border-border-strong transition-colors"
            style={{ fontSize: 13, padding: "9px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 rounded-lg font-semibold transition-colors"
            style={{
              fontSize: 13,
              padding: "9px",
              background: canSave && !saving ? "#a78bfa" : "#1a1b21",
              color: canSave && !saving ? "#0a0b0e" : "#4b5563",
              cursor: canSave && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}
