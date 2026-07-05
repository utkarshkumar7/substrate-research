import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Signal Feed" }

const KIND_COLOR: Record<string, string> = {
  anomaly: "#f87171",
  signal:  "#22d3ee",
  flow:    "#4ade80",
  context: "#f0a24e",
}

const SIGNAL_KINDS = ["anomaly", "signal", "flow", "context"]

export default async function InsightsPage() {
  const client = createClient()
  const { data: insights } = await client
    .from("insights")
    .select("id, kind, title, body, related_symbols, created_at")
    .in("kind", SIGNAL_KINDS)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Signal Feed</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          Anomalies, volume signals, correlation breaks, and supply chain flow detected by the Python pipeline.
          Run <code className="font-mono text-accent" style={{ fontSize: 12 }}>uv run python insights.py</code> to refresh.
        </p>
      </div>

      {(!insights || insights.length === 0) && (
        <div className="text-text-muted text-center py-20" style={{ fontSize: 14 }}>
          No signals yet — run <code className="font-mono text-accent" style={{ fontSize: 13 }}>uv run python insights.py</code> in the agent directory.
        </div>
      )}

      <div className="space-y-3">
        {(insights ?? []).map(ins => {
          const color = KIND_COLOR[ins.kind] ?? "#71717a"
          return (
            <div key={ins.id} className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono uppercase"
                  style={{ fontSize: 10, fontWeight: 700, background: "#16171c", color }}
                >
                  {ins.kind}
                </span>
                {ins.related_symbols?.slice(0, 4).map((s: string) => (
                  <a
                    key={s}
                    href={`/ticker/${s}`}
                    className="font-mono hover:text-accent transition-colors"
                    style={{ fontSize: 10, color: "#6b7280" }}
                  >
                    {s}
                  </a>
                ))}
                <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 11 }}>
                  {new Date(ins.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="text-text font-medium mb-1" style={{ fontSize: 13 }}>{ins.title}</div>
              <p className="text-text-secondary line-clamp-3" style={{ fontSize: 12, lineHeight: 1.6 }}>
                {ins.body}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
