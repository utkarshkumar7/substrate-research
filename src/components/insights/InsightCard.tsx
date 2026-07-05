import Link from "next/link"
import type { InsightRow } from "@/lib/queries/insights"
import { stripMarkdown } from "@/lib/format"

function hrefForKind(kind: string): string {
  if (kind === "daily" || kind === "weekly") return "/daily"
  if (kind === "anomaly" || kind === "signal" || kind === "flow") return "/anomalies"
  return "/insights"
}

const KIND_META: Record<string, { label: string; color: string; bg: string }> = {
  anomaly: { label: "ANOMALY", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  flow:    { label: "FLOW",    color: "#22d3ee", bg: "rgba(34,211,238,0.10)" },
  signal:  { label: "SIGNAL",  color: "#4ade80", bg: "rgba(74,222,128,0.10)" },
  context: { label: "CONTEXT", color: "#f0a24e", bg: "rgba(240,162,78,0.12)" },
  daily:   { label: "DAILY",   color: "#f0a24e", bg: "rgba(240,162,78,0.12)" },
  weekly:  { label: "WEEKLY",  color: "#f0a24e", bg: "rgba(240,162,78,0.12)" },
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function shortModel(model: string | null): string {
  if (!model) return ""
  if (model.includes("haiku")) return "haiku"
  if (model.includes("sonnet")) return "sonnet"
  if (model.includes("opus")) return "opus"
  return model.split("-").pop() ?? model
}

export default function InsightCard({ insight }: { insight: InsightRow }) {
  const meta = KIND_META[insight.kind] ?? KIND_META.context

  return (
    <Link
      href={hrefForKind(insight.kind)}
      className="block border border-border rounded-lg hover:border-border-strong hover:bg-bg-hover transition-colors"
      style={{ padding: "10px 12px", marginBottom: 8 }}
    >
      {/* Tag pill */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="rounded font-semibold tracking-wider"
          style={{
            fontSize: 9,
            padding: "2px 6px",
            color: meta.color,
            background: meta.bg,
            letterSpacing: "0.06em",
          }}
        >
          {meta.label}
        </span>
        {(insight.related_symbols?.length ?? 0) > 0 && (
          <span className="text-text-muted font-mono" style={{ fontSize: 10 }}>
            {insight.related_symbols!.slice(0, 3).join(" · ")}
          </span>
        )}
      </div>

      {/* Title */}
      <div
        className="font-semibold text-text leading-snug mb-1"
        style={{ fontSize: 12 }}
      >
        {insight.title}
      </div>

      {/* Body (2-line clamp) */}
      <div
        className="text-text-muted"
        style={{
          fontSize: 11,
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as React.CSSProperties}
      >
        {stripMarkdown(insight.body)}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 text-text-muted" style={{ fontSize: 10 }}>
        <span>{timeAgo(insight.created_at)}</span>
        {insight.model && (
          <>
            <span>·</span>
            <span className="text-accent opacity-70">{shortModel(insight.model)}</span>
          </>
        )}
      </div>
    </Link>
  )
}
