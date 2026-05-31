"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { JournalEntry } from "@/lib/queries/journal"
import { addEntry, updateEntry, removeEntry } from "./actions"

const STATUS_COLORS: Record<string, string> = {
  watching: "#71717a",
  open:     "#a78bfa",
  closed:   "#4ade80",
}

const DIRECTION_LABEL: Record<string, string> = {
  long:  "LONG",
  short: "SHORT",
  call:  "CALL",
  put:   "PUT",
}

const DIRECTION_COLOR: Record<string, string> = {
  long:  "#4ade80",
  short: "#f87171",
  call:  "#4ade80",
  put:   "#f87171",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatExpiry(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function optionSummary(entry: JournalEntry): string | null {
  if (entry.direction !== "call" && entry.direction !== "put") return null
  if (!entry.strike && !entry.expiry) return null
  const suffix = entry.direction === "call" ? "C" : "P"
  const strike = entry.strike ? `$${entry.strike}` : ""
  const exp = entry.expiry ? formatExpiry(entry.expiry) : ""
  return [exp, strike + suffix].filter(Boolean).join(" ")
}

function moneynessInfo(
  entry: JournalEntry,
  latestPrices: Record<string, number>
): { label: string; pct: number; color: string } | null {
  if ((entry.direction !== "call" && entry.direction !== "put") || !entry.strike || !entry.symbol) return null
  const price = latestPrices[entry.symbol]
  if (price == null) return null
  const strike = entry.strike
  const isCall = entry.direction === "call"
  // positive = in-the-money
  const itm = isCall ? price - strike : strike - price
  const pct = (itm / strike) * 100
  if (Math.abs(pct) < 1) return { label: "ATM", pct, color: "#71717a" }
  if (itm > 0) return { label: "ITM", pct, color: "#4ade80" }
  return { label: "OTM", pct, color: "#f87171" }
}

interface Prefill {
  symbol: string
  status: string
  direction: string
  thesis?: string
}

interface Props {
  initialEntries: JournalEntry[]
  latestPrices?: Record<string, number>
  prefill?: Prefill
}

const EMPTY_FORM = {
  symbol: "",
  direction: "long" as string,
  status: "watching" as string,
  entry_price: "",
  shares: "",
  thesis: "",
  tags: "",
  expiry: "",
  strike: "",
}

function entryToForm(e: JournalEntry) {
  return {
    symbol: e.symbol ?? "",
    direction: e.direction ?? "long",
    status: e.status,
    entry_price: e.entry_price != null ? String(e.entry_price) : "",
    shares: e.shares != null ? String(e.shares) : "",
    thesis: e.thesis,
    tags: (e.tags ?? []).join(", "),
    expiry: e.expiry ?? "",
    strike: e.strike != null ? String(e.strike) : "",
  }
}

export default function JournalClient({ initialEntries, latestPrices = {}, prefill }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [showForm, setShowForm] = useState(!!prefill)
  const [form, setForm] = useState(prefill ? { ...EMPTY_FORM, symbol: prefill.symbol, status: prefill.status, direction: prefill.direction, thesis: prefill.thesis ?? "" } : EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [outcomeText, setOutcomeText] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Clear prefill params from URL after consuming them
  useEffect(() => {
    if (prefill) {
      const url = new URL(window.location.href)
      url.searchParams.delete("symbol")
      url.searchParams.delete("status")
      url.searchParams.delete("direction")
      url.searchParams.delete("thesis")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const isOption = form.direction === "call" || form.direction === "put"
  const isEditOption = editForm.direction === "call" || editForm.direction === "put"

  const handleSubmit = () => {
    if (!form.thesis.trim()) return
    const entry = {
      symbol: form.symbol.trim().toUpperCase() || null,
      direction: form.direction || null,
      status: form.status,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      shares: form.shares ? parseFloat(form.shares) : null,
      thesis: form.thesis.trim(),
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      expiry: isOption && form.expiry ? form.expiry : null,
      strike: isOption && form.strike ? parseFloat(form.strike) : null,
    }
    startTransition(async () => {
      await addEntry(entry)
      setForm(EMPTY_FORM)
      setShowForm(false)
      router.refresh()
    })
  }

  const handleSaveEdit = (id: string) => {
    if (!editForm.thesis.trim()) return
    const updates = {
      symbol: editForm.symbol.trim().toUpperCase() || null,
      direction: editForm.direction || null,
      status: editForm.status,
      entry_price: editForm.entry_price ? parseFloat(editForm.entry_price) : null,
      shares: editForm.shares ? parseFloat(editForm.shares) : null,
      thesis: editForm.thesis.trim(),
      tags: editForm.tags ? editForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      expiry: isEditOption && editForm.expiry ? editForm.expiry : null,
      strike: isEditOption && editForm.strike ? parseFloat(editForm.strike) : null,
    }
    startTransition(async () => {
      await updateEntry(id, updates)
      setEditingId(null)
      router.refresh()
    })
  }

  const handleClose = (id: string) => {
    startTransition(async () => {
      await updateEntry(id, { status: "closed", outcome_notes: outcomeText || null })
      setClosingId(null)
      setOutcomeText("")
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this entry?")) return
    startTransition(async () => {
      await removeEntry(id)
      router.refresh()
    })
  }

  const openEntries   = entries.filter(e => e.status === "open")
  const watchEntries  = entries.filter(e => e.status === "watching")
  const closedEntries = entries.filter(e => e.status === "closed")

  const Section = ({ title, items }: { title: string; items: JournalEntry[] }) => {
    if (!items.length) return null
    return (
      <div className="mb-8">
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          {title} ({items.length})
        </div>
        <div className="space-y-2">
          {items.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              editing={editingId === entry.id}
              onToggle={() => {
                setExpandedId(expandedId === entry.id ? null : entry.id)
                setEditingId(null)
              }}
              onAskClaude={() => {
                const prompt = `Journal entry review — ${entry.symbol ?? "general"}: ${entry.thesis}${entry.status === "open" ? ". Should I adjust this position?" : ""}`
                router.push(`/ask?q=${encodeURIComponent(prompt)}`)
              }}
              onStartClose={() => { setClosingId(entry.id); setOutcomeText("") }}
              onStartEdit={() => {
                setEditingId(entry.id)
                setEditForm(entryToForm(entry))
                setExpandedId(entry.id)
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => handleSaveEdit(entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
        {closingId && items.find(e => e.id === closingId) && (
          <div className="mt-3 p-4 rounded border border-border bg-bg-card-2">
            <div className="text-text-secondary mb-2" style={{ fontSize: 12 }}>
              Outcome notes (optional)
            </div>
            <textarea
              value={outcomeText}
              onChange={e => setOutcomeText(e.target.value)}
              placeholder="What happened? Was the thesis right?"
              className="w-full bg-bg rounded border border-border text-text resize-none outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "8px 10px", minHeight: 72 }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleClose(closingId)}
                disabled={isPending}
                className="rounded text-sm transition-colors"
                style={{ background: "#4ade80", color: "#0a0b0e", padding: "5px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Mark closed
              </button>
              <button
                onClick={() => setClosingId(null)}
                className="rounded text-text-muted border border-border"
                style={{ padding: "5px 12px", fontSize: 12, background: "transparent", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Trade Journal</h1>
          <p className="text-text-muted mt-0.5" style={{ fontSize: 13 }}>
            Log trade theses, track outcomes, inform Claude.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM) }}
          className="rounded-lg border transition-colors"
          style={{
            fontSize: 13, padding: "7px 16px", fontWeight: 500,
            background: showForm ? "#1a1b21" : "#a78bfa",
            color: showForm ? "#9ca3af" : "#0a0b0e",
            border: showForm ? "1px solid #1f2127" : "none",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ New entry"}
        </button>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="mb-8 p-5 rounded-xl border border-border bg-bg-card">
          <EntryForm form={form} setForm={setForm} isOption={isOption} />
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.thesis.trim()}
            className="rounded-lg transition-colors"
            style={{
              background: form.thesis.trim() ? "#a78bfa" : "#1a1b21",
              color: form.thesis.trim() ? "#0a0b0e" : "#4b5563",
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              border: "none", cursor: form.thesis.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save entry
          </button>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-text-muted text-center py-16" style={{ fontSize: 14 }}>
          No entries yet. Write your first trade thesis above.
        </div>
      )}

      <Section title="Open positions" items={openEntries} />
      <Section title="Watching" items={watchEntries} />
      <Section title="Closed" items={closedEntries} />
    </div>
  )

  function EntryCard({
    entry, expanded, editing,
    onToggle, onAskClaude, onStartClose, onStartEdit, onCancelEdit, onSaveEdit, onDelete,
  }: {
    entry: JournalEntry
    expanded: boolean
    editing: boolean
    onToggle: () => void
    onAskClaude: () => void
    onStartClose: () => void
    onStartEdit: () => void
    onCancelEdit: () => void
    onSaveEdit: () => void
    onDelete: () => void
  }) {
    const optSummary = optionSummary(entry)
    const moneyness = entry.status !== "closed" ? moneynessInfo(entry, latestPrices) : null

    return (
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
        <div
          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-bg-hover transition-colors"
          onClick={onToggle}
        >
          <span
            className="mt-1 shrink-0 rounded-full"
            style={{ width: 7, height: 7, background: STATUS_COLORS[entry.status] ?? "#71717a" }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.symbol && (
                <Link
                  href={`/ticker/${entry.symbol}`}
                  onClick={e => e.stopPropagation()}
                  className="font-mono font-semibold hover:underline"
                  style={{ fontSize: 13, color: "#a78bfa" }}
                >
                  {entry.symbol}
                </Link>
              )}
              {entry.direction && (
                <span
                  className="font-mono rounded px-1.5 py-0.5"
                  style={{ fontSize: 10, fontWeight: 700, background: "#16171c", color: DIRECTION_COLOR[entry.direction] ?? "#71717a" }}
                >
                  {DIRECTION_LABEL[entry.direction]}
                </span>
              )}
              {optSummary && (
                <span className="font-mono text-text-secondary" style={{ fontSize: 11 }}>
                  {optSummary}
                </span>
              )}
              {moneyness && (
                <span
                  className="font-mono rounded px-1.5 py-0.5"
                  style={{ fontSize: 10, fontWeight: 600, background: "#16171c", color: moneyness.color }}
                >
                  {moneyness.label} {Math.abs(moneyness.pct).toFixed(1)}%
                </span>
              )}
              {entry.tags.map(tag => (
                <span key={tag} className="rounded px-1.5 py-0.5 text-text-muted border border-border" style={{ fontSize: 10 }}>
                  {tag}
                </span>
              ))}
              <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 11 }}>
                {formatDate(entry.created_at)}
              </span>
            </div>
            <p className="text-text-secondary mt-1.5 line-clamp-2" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {entry.thesis}
            </p>
          </div>
        </div>

        {expanded && !editing && (
          <div className="border-t border-border px-4 pb-4 pt-3 bg-bg-card-2">
            <p className="text-text-secondary mb-3" style={{ fontSize: 13, lineHeight: 1.7 }}>
              {entry.thesis}
            </p>

            {(entry.entry_price || entry.shares || entry.exit_price || entry.strike || entry.expiry) && (
              <div className="flex gap-6 mb-3 font-mono flex-wrap" style={{ fontSize: 12 }}>
                {entry.entry_price && <span className="text-text-muted">Entry: <span className="text-text">${entry.entry_price}</span></span>}
                {entry.shares && <span className="text-text-muted">{entry.direction === "call" || entry.direction === "put" ? "Contracts" : "Shares"}: <span className="text-text">{entry.shares}</span></span>}
                {entry.exit_price && <span className="text-text-muted">Exit: <span className="text-text">${entry.exit_price}</span></span>}
                {entry.strike && <span className="text-text-muted">Strike: <span className="text-text">${entry.strike}</span></span>}
                {entry.expiry && <span className="text-text-muted">Exp: <span className="text-text">{formatExpiry(entry.expiry)}</span></span>}
                {moneyness && entry.symbol && latestPrices[entry.symbol] && (
                  <span className="text-text-muted">
                    Underlying: <span className="text-text font-mono">${latestPrices[entry.symbol].toFixed(2)}</span>
                  </span>
                )}
              </div>
            )}

            {entry.outcome_notes && (
              <div className="mb-3 p-3 rounded border border-border bg-bg" style={{ fontSize: 12 }}>
                <span className="text-text-muted">Outcome: </span>
                <span className="text-text-secondary">{entry.outcome_notes}</span>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onAskClaude}
                className="rounded border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
                style={{ fontSize: 11, padding: "4px 12px", background: "#16171c", cursor: "pointer" }}
              >
                Ask Claude →
              </button>
              <button
                onClick={onStartEdit}
                className="rounded border border-border text-text-secondary hover:border-border-strong hover:text-text transition-colors"
                style={{ fontSize: 11, padding: "4px 12px", background: "#16171c", cursor: "pointer" }}
              >
                Edit
              </button>
              {entry.status === "open" && (
                <button
                  onClick={onStartClose}
                  className="rounded border border-border text-text-secondary hover:border-up hover:text-up transition-colors"
                  style={{ fontSize: 11, padding: "4px 12px", background: "#16171c", cursor: "pointer" }}
                >
                  Mark closed
                </button>
              )}
              <button
                onClick={onDelete}
                className="rounded border border-border text-text-muted hover:border-down hover:text-down transition-colors ml-auto"
                style={{ fontSize: 11, padding: "4px 12px", background: "transparent", cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {expanded && editing && (
          <div className="border-t border-border px-4 pb-4 pt-3 bg-bg-card-2">
            <div className="text-text-muted mb-3" style={{ fontSize: 11 }}>Edit entry</div>
            <EntryForm form={editForm} setForm={setEditForm} isOption={isEditOption} />
            <div className="flex gap-2">
              <button
                onClick={onSaveEdit}
                disabled={isPending || !editForm.thesis.trim()}
                className="rounded-lg transition-colors"
                style={{
                  background: editForm.thesis.trim() ? "#a78bfa" : "#1a1b21",
                  color: editForm.thesis.trim() ? "#0a0b0e" : "#4b5563",
                  padding: "7px 18px", fontSize: 12, fontWeight: 600,
                  border: "none", cursor: editForm.thesis.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save changes
              </button>
              <button
                onClick={onCancelEdit}
                className="rounded border border-border text-text-muted"
                style={{ padding: "7px 14px", fontSize: 12, background: "transparent", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function EntryForm({
    form,
    setForm,
    isOption,
  }: {
    form: typeof EMPTY_FORM
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
    isOption: boolean
  }) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Symbol</label>
            <input
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              placeholder="NVDA"
              className="w-full rounded border border-border bg-bg text-text font-mono outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "7px 10px" }}
            />
          </div>
          <div>
            <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Direction</label>
            <select
              value={form.direction}
              onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
              className="w-full rounded border border-border bg-bg text-text outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "7px 10px" }}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
              <option value="call">Call option</option>
              <option value="put">Put option</option>
            </select>
          </div>
          <div>
            <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded border border-border bg-bg text-text outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "7px 10px" }}
            >
              <option value="watching">Watching</option>
              <option value="open">Open (in trade)</option>
            </select>
          </div>
          <div>
            <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Entry price</label>
            <input
              value={form.entry_price}
              onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))}
              placeholder="225.00"
              type="number"
              className="w-full rounded border border-border bg-bg text-text font-mono outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "7px 10px" }}
            />
          </div>
          <div>
            <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>{isOption ? "Contracts" : "Shares"}</label>
            <input
              value={form.shares}
              onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
              placeholder={isOption ? "1" : "10"}
              type="number"
              className="w-full rounded border border-border bg-bg text-text font-mono outline-none focus:border-border-strong"
              style={{ fontSize: 13, padding: "7px 10px" }}
            />
          </div>
          {isOption && (
            <>
              <div>
                <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Strike</label>
                <input
                  value={form.strike}
                  onChange={e => setForm(f => ({ ...f, strike: e.target.value }))}
                  placeholder="230"
                  type="number"
                  className="w-full rounded border border-border bg-bg text-text font-mono outline-none focus:border-border-strong"
                  style={{ fontSize: 13, padding: "7px 10px" }}
                />
              </div>
              <div>
                <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Expiry</label>
                <input
                  value={form.expiry}
                  onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                  type="date"
                  className="w-full rounded border border-border bg-bg text-text font-mono outline-none focus:border-border-strong"
                  style={{ fontSize: 13, padding: "7px 10px" }}
                />
              </div>
            </>
          )}
        </div>

        <div className="mb-3">
          <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Thesis <span className="text-down">*</span></label>
          <textarea
            value={form.thesis}
            onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))}
            placeholder="Why are you considering this trade? What's the setup, catalyst, and risk?"
            className="w-full rounded border border-border bg-bg text-text resize-none outline-none focus:border-border-strong"
            style={{ fontSize: 13, padding: "8px 10px", minHeight: 96, lineHeight: 1.6 }}
          />
        </div>

        <div className="mb-4">
          <label className="text-text-muted block mb-1" style={{ fontSize: 11 }}>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="pullback, earnings, macro"
            className="w-full rounded border border-border bg-bg text-text outline-none focus:border-border-strong"
            style={{ fontSize: 13, padding: "7px 10px" }}
          />
        </div>
      </>
    )
  }
}
