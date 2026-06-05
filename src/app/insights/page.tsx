import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Insights" }

export default async function InsightsPage() {
  const client = createClient()
  const { data: insights } = await client
    .from("insights")
    .select("id, kind, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  const kindColor: Record<string, string> = {
    daily: "#a78bfa",
    anomaly: "#f87171",
    signal: "#22d3ee",
    flow: "#4ade80",
    context: "#71717a",
    weekly: "#9ca3af",
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>Insights</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          All generated reports and detected signals.
        </p>
      </div>

      {(!insights || insights.length === 0) && (
        <div className="text-text-muted text-center py-20" style={{ fontSize: 14 }}>
          No insights yet. Run the daily brief or the Python insights pipeline.
        </div>
      )}

      <div className="space-y-3">
        {(insights ?? []).map(ins => (
          <div key={ins.id} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="rounded px-1.5 py-0.5 font-mono uppercase"
                style={{ fontSize: 10, fontWeight: 700, background: "#16171c", color: kindColor[ins.kind] ?? "#71717a" }}
              >
                {ins.kind}
              </span>
              <span className="text-text font-medium" style={{ fontSize: 13 }}>{ins.title}</span>
              <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 11 }}>
                {new Date(ins.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-text-secondary line-clamp-3" style={{ fontSize: 12, lineHeight: 1.6 }}>
              {ins.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
