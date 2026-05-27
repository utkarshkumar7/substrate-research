import { createClient } from "@/lib/supabase/server"
import { PULLBACK_WATCHLIST } from "@/lib/pullback/watchlist.generated"
import { getPullbackMetrics, type PullbackMetrics } from "@/lib/analytics/pullback"
import PullbackTable from "./PullbackTable"

export const metadata = { title: "Pullback Radar" }

export default async function PullbackPage() {
  const client = createClient()
  const metrics = await getPullbackMetrics(client, PULLBACK_WATCHLIST)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>
          Pullback Radar
        </h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          High-beta names sorted by distance from 52-week high. Entry timing signals.
        </p>
      </div>

      <PullbackTable metrics={metrics} />
    </div>
  )
}
