import { createClient } from "@/lib/supabase/server"
import { getRecentInsights } from "@/lib/queries/insights"
import InsightCard from "./InsightCard"

export default async function InsightList() {
  const client = createClient()
  const insights = await getRecentInsights(client, 4)

  if (!insights.length) {
    return (
      <p className="text-text-muted" style={{ fontSize: 11 }}>
        No signals in the last 7 days. New anomalies and flow shifts appear here after each refresh.
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
