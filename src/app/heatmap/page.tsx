import { Suspense } from "react";
import HeatmapGrid from "@/components/heatmap/HeatmapGrid";

export const dynamic = "force-dynamic";

function HeatmapSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid gap-3 items-center"
          style={{ gridTemplateColumns: "140px 1fr" }}
        >
          <div className="bg-bg-card rounded h-4 w-24 animate-pulse" />
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="bg-bg-card rounded h-7 w-14 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HeatmapPage() {
  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 22 }}>
            Layer heatmap
          </h1>
          <p className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
            Compact view · grouped by supply chain position · sorted by layer momentum
          </p>
        </div>
      </div>

      <div
        className="bg-bg-card border border-border rounded-xl"
        style={{ padding: "18px 20px" }}
      >
        <Suspense fallback={<HeatmapSkeleton />}>
          <HeatmapGrid />
        </Suspense>
      </div>
    </div>
  );
}
