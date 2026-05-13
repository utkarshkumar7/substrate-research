import { topology } from "@/lib/topology"
import type { SymbolSnapshot } from "@/lib/analytics/performance"
import PipelineCanvas from "./PipelineCanvas"

interface Props {
  snapshots: Record<string, SymbolSnapshot>
}

export default function PipelineGraph({ snapshots }: Props) {
  return (
    <PipelineCanvas
      layers={topology.layers}
      tickers={topology.tickers}
      edges={topology.edges}
      snapshots={snapshots}
    />
  )
}
