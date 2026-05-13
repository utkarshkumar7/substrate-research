import { createClient } from "@/lib/supabase/server"
import { getRecentInsights } from "@/lib/queries/insights"
import InsightCard from "./InsightCard"

export default async function InsightList() {
  const client = createClient()
  const insights = await getRecentInsights(client, 4)

  if (!insights.length) {
    return (
      <p className="text-text-muted" style={{ fontSize: 11 }}>
        No insights yet — run <code className="font-mono">uv run python insights.py</code> (Phase 7)
      </p>
    )
  }

  return (
    <div>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  )
}
