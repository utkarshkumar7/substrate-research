"use client"

import { useState, useRef } from "react"
import ReactMarkdown from "react-markdown"

type Report = { id: string; title: string; body: string; created_at: string }

interface Props {
  reports: Report[]
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  })
}

export default function DailyClient({ reports: initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [generating, setGenerating] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(initialReports[0]?.id ?? null)
  const abortRef = useRef<AbortController | null>(null)

  const generate = async () => {
    setGenerating(true)
    setStreamText("")
    setSelectedId(null)
    setError(null)
    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/daily", { method: "POST", signal: abortRef.current.signal })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "delta") setStreamText(t => t + data.text)
              else if (data.type === "done") window.location.reload()
              else if (data.type === "error") setError(data.message)
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const selected = reports.find(r => r.id === selectedId)
  const displayBody = generating || streamText ? streamText : selected?.body

  return (
    <div className="p-6 flex gap-6 max-w-5xl">
      {/* History sidebar */}
      <div className="shrink-0" style={{ width: 200 }}>
        <div className="text-text-muted uppercase mb-3" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          Past briefs
        </div>
        <div className="space-y-1">
          {reports.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedId(r.id); setStreamText("") }}
              className="w-full text-left rounded-lg px-3 py-2 transition-colors"
              style={{
                background: selectedId === r.id && !generating ? "#1a1b21" : "transparent",
                border: selectedId === r.id && !generating ? "1px solid #2a2c33" : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              <div className="font-mono" style={{ fontSize: 12, color: selectedId === r.id ? "#a78bfa" : "#e8e9ec" }}>
                {formatDay(r.created_at)}
              </div>
            </button>
          ))}
          {reports.length === 0 && (
            <div className="text-text-muted" style={{ fontSize: 12 }}>No briefs yet</div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Daily Brief</h1>
            {selected && !generating && (
              <p className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
                {formatTs(selected.created_at)}
              </p>
            )}
            {generating && (
              <p className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>Generating…</p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-lg transition-colors flex items-center gap-2 shrink-0"
            style={{
              background: generating ? "#1a1b21" : "#a78bfa",
              color: generating ? "#6b7280" : "#0a0b0e",
              padding: "8px 18px", fontSize: 13, fontWeight: 600,
              border: generating ? "1px solid #1f2127" : "none",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating && (
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="6" cy="6" r="4" fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="16 8" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </svg>
            )}
            {generating ? "Generating…" : "Generate today's brief"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-down text-down" style={{ fontSize: 12 }}>
            {error}
          </div>
        )}

        {!displayBody && !generating && (
          <div className="text-text-muted text-center py-20" style={{ fontSize: 14 }}>
            {reports.length === 0
              ? "No briefs yet. Click \"Generate today's brief\" to create the first one."
              : "Select a date from the left or generate today's brief."}
          </div>
        )}

        {displayBody && (
          <div
            className="prose prose-invert max-w-none"
            style={{ fontSize: 14, lineHeight: 1.8, color: "#e8e9ec" }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e8e9ec", marginTop: 24, marginBottom: 8 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 600, color: "#e8e9ec", marginTop: 20, marginBottom: 6 }}>{children}</h2>,
                strong: ({ children }) => <strong style={{ color: "#a78bfa", fontWeight: 600 }}>{children}</strong>,
                p: ({ children }) => <p style={{ marginBottom: 12, color: "#9ca3af", lineHeight: 1.7 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                li: ({ children }) => <li style={{ color: "#9ca3af", marginBottom: 4 }}>{children}</li>,
                code: ({ children }) => <code style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#22d3ee", background: "#16171c", padding: "1px 5px", borderRadius: 3 }}>{children}</code>,
              }}
            >
              {displayBody}
            </ReactMarkdown>
            {generating && <span className="inline-block w-2 h-4 bg-accent ml-0.5" style={{ animation: "blink 1s step-end infinite" }} />}
          </div>
        )}
      </div>
    </div>
  )
}
