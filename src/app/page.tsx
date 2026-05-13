export default function HomePage() {
  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="font-semibold tracking-tight" style={{ fontSize: 22 }}>
          Stack overview
        </h1>
        <span className="text-text-muted" style={{ fontSize: 12 }}>
          Pipeline &amp; heatmap coming in Phase 3 &amp; 4
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Basket vs SPY (5d)", value: "—", delta: "run Phase 3" },
          { label: "Hottest layer", value: "—", delta: "run Phase 3" },
          { label: "Coldest layer", value: "—", delta: "run Phase 3" },
          { label: "Open anomalies", value: "—", delta: "run Phase 7" },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-bg-card border border-border rounded-xl"
            style={{ padding: "14px 16px" }}
          >
            <div
              className="text-text-muted uppercase mb-1.5"
              style={{ fontSize: 11, letterSpacing: "0.05em" }}
            >
              {m.label}
            </div>
            <div className="font-semibold tracking-tight" style={{ fontSize: 20 }}>
              {m.value}
            </div>
            <div className="text-text-muted mt-1" style={{ fontSize: 12 }}>
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline placeholder */}
      <div className="bg-bg-card border border-border rounded-xl mb-4" style={{ padding: "18px 20px" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold tracking-tight" style={{ fontSize: 14 }}>
              AI supply chain pipeline
            </div>
            <div className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
              Silicon → chatbot · Phase 4
            </div>
          </div>
        </div>
        <div
          className="bg-bg border border-border rounded-lg flex items-center justify-center text-text-muted"
          style={{ height: 320, fontSize: 13 }}
        >
          Pipeline graph — Phase 4
        </div>
      </div>

      {/* Heatmap placeholder */}
      <div className="bg-bg-card border border-border rounded-xl" style={{ padding: "18px 20px" }}>
        <div className="font-semibold tracking-tight mb-2" style={{ fontSize: 14 }}>
          Layer heatmap
        </div>
        <div
          className="flex items-center justify-center text-text-muted bg-bg border border-border rounded-lg"
          style={{ height: 160, fontSize: 13 }}
        >
          Heatmap — Phase 3
        </div>
      </div>
    </div>
  );
}
