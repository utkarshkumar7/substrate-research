import { createClient } from "@/lib/supabase/server"
import { fetchableSymbols } from "@/lib/topology"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import PipelineGraph from "@/components/pipeline/PipelineGraph"

export default async function PipelinePage() {
  const client = createClient()
  const snapshots = await getHeatmapSnapshot(client, fetchableSymbols())

  return (
    <div className="p-6">
      <div className="flex items-baseline gap-2 mb-5">
        <h1 className="font-semibold tracking-tight" style={{ fontSize: 22 }}>
          Supply chain pipeline
        </h1>
        <span className="text-text-muted" style={{ fontSize: 13 }}>
          Silicon → inference/agents
        </span>
      </div>
      <div className="bg-bg-card border border-border rounded-xl" style={{ padding: "20px 24px" }}>
        <PipelineGraph snapshots={snapshots} />
      </div>
    </div>
  )
}
