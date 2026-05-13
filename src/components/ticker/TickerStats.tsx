import { formatPercent } from "@/lib/format"

interface Props {
  latestPrice: number
  high52w: number | null
  low52w: number | null
  pct1d: number | null
  pct5d: number | null
  pct1m: number | null
  pctYtd: number | null
  rsi: number | null
  betaVsSpy: number | null
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-muted uppercase tracking-wider" style={{ fontSize: 9 }}>
        {label}
      </span>
      <span className="font-mono font-semibold" style={{ fontSize: 13, color: color ?? "#e8e9ec" }}>
        {value}
      </span>
    </div>
  )
}

function pctColor(v: number | null): string | undefined {
  if (v == null) return undefined
  return v >= 0 ? "#4ade80" : "#f87171"
}

function fmtPct(v: number | null): string {
  return v != null ? formatPercent(v, 1) + "%" : "—"
}

export default function TickerStats({
  latestPrice,
  high52w,
  low52w,
  pct1d,
  pct5d,
  pct1m,
  pctYtd,
  rsi,
  betaVsSpy,
}: Props) {
  const rangeStr =
    high52w != null && low52w != null
      ? `$${low52w.toFixed(2)} – $${high52w.toFixed(2)}`
      : "—"

  let rsiColor = "#e8e9ec"
  if (rsi != null) {
    if (rsi >= 70) rsiColor = "#f87171"
    else if (rsi <= 30) rsiColor = "#4ade80"
  }

  return (
    <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      <Stat label="Price" value={`$${latestPrice.toFixed(2)}`} />
      <Stat label="52W Range" value={rangeStr} />
      <Stat label="1D" value={fmtPct(pct1d)} color={pctColor(pct1d)} />
      <Stat label="5D" value={fmtPct(pct5d)} color={pctColor(pct5d)} />
      <Stat label="1M" value={fmtPct(pct1m)} color={pctColor(pct1m)} />
      <Stat label="YTD" value={fmtPct(pctYtd)} color={pctColor(pctYtd)} />
      <Stat label="RSI (14)" value={rsi != null ? rsi.toFixed(1) : "—"} color={rsiColor} />
      <Stat label="Beta vs SPY" value={betaVsSpy != null ? betaVsSpy.toFixed(2) : "—"} />
    </div>
  )
}
