import { formatCurrency, formatPercent } from "@/lib/format"

interface Props {
  totalValue: number
  totalCost: number | null
  totalPnl: number | null
  totalPnlPct: number | null
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-xl border border-border flex flex-col"
      style={{ background: "#111217", padding: "14px 16px" }}
    >
      <div className="text-text-muted mb-1" style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="font-mono font-semibold" style={{ fontSize: 18, color: color ?? "#e8e9ec" }}>
        {value}
      </div>
    </div>
  )
}

export default function PortfolioStats({ totalValue, totalCost, totalPnl, totalPnlPct }: Props) {
  const pnlColor =
    totalPnl == null ? "#6b7280" : totalPnl >= 0 ? "#4ade80" : "#f87171"

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Stat label="Total Value" value={formatCurrency(totalValue)} />
      <Stat label="Cost Basis" value={totalCost != null ? formatCurrency(totalCost) : "—"} />
      <Stat
        label="Unrealized P&L"
        value={totalPnl != null ? formatCurrency(totalPnl) : "—"}
        color={pnlColor}
      />
      <Stat
        label="Return"
        value={totalPnlPct != null ? `${formatPercent(totalPnlPct)}%` : "—"}
        color={pnlColor}
      />
    </div>
  )
}
