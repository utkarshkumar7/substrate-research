import { createClient } from "@/lib/supabase/server"

interface MacroCell {
  label: string
  symbol: string
  displayFn: (v: number) => string
  deltaFn: (current: number, prior: number) => string
  deltaColor: (delta: number) => string
}

const CELLS: MacroCell[] = [
  {
    label: "10Y",
    symbol: "^TNX",
    displayFn: (v) => `${v.toFixed(2)}%`,
    deltaFn: (c, p) => {
      const bps = Math.round((c - p) * 100)
      const sign = bps > 0 ? "+" : ""
      return `${sign}${bps}bp`
    },
    deltaColor: () => "#71717a",
  },
  {
    label: "DXY",
    symbol: "DX-Y.NYB",
    displayFn: (v) => v.toFixed(1),
    deltaFn: (c, p) => {
      const pct = ((c - p) / p) * 100
      const sign = pct > 0 ? "+" : ""
      return `${sign}${pct.toFixed(1)}%`
    },
    deltaColor: () => "#71717a",
  },
  {
    label: "VIX",
    symbol: "^VIX",
    displayFn: (v) => v.toFixed(1),
    deltaFn: (c, p) => {
      const d = c - p
      const sign = d > 0 ? "+" : ""
      return `${sign}${d.toFixed(1)}`
    },
    deltaColor: (delta) => (delta > 0.5 ? "#f87171" : delta < -0.5 ? "#4ade80" : "#71717a"),
  },
  {
    label: "HY/IG",
    symbol: "__hyig__",
    displayFn: (v) => v.toFixed(2),
    deltaFn: (c, p) => {
      const pct = ((c - p) / p) * 100
      const sign = pct > 0 ? "+" : ""
      return `${sign}${pct.toFixed(1)}%`
    },
    deltaColor: (delta) => (delta < -0.3 ? "#f87171" : delta > 0.3 ? "#4ade80" : "#71717a"),
  },
]

function arrow(delta: number, threshold = 0.01): string {
  if (delta > threshold) return "↑"
  if (delta < -threshold) return "↓"
  return "→"
}

async function fetchMacroData(): Promise<
  Record<string, { latest: number; prior5d: number | null }>
> {
  const client = createClient()
  const symbols = ["^TNX", "DX-Y.NYB", "^VIX", "HYG", "LQD"]

  const since = new Date()
  since.setDate(since.getDate() - 20)

  const { data } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .in("symbol", symbols)
    .gte("trade_date", since.toISOString().slice(0, 10))
    .order("trade_date", { ascending: false })

  const grouped: Record<string, Array<{ close: number }>> = {}
  for (const row of data ?? []) {
    ;(grouped[row.symbol] ??= []).push({ close: row.close })
  }

  const result: Record<string, { latest: number; prior5d: number | null }> = {}
  for (const sym of symbols) {
    const rows = grouped[sym] ?? []
    if (!rows.length) continue
    result[sym] = {
      latest: rows[0].close,
      prior5d: rows[5]?.close ?? null,
    }
  }

  // Compute HY/IG ratio
  const hyg = result["HYG"]
  const lqd = result["LQD"]
  if (hyg && lqd) {
    result["__hyig__"] = {
      latest: hyg.latest / lqd.latest,
      prior5d:
        hyg.prior5d != null && lqd.prior5d != null ? hyg.prior5d / lqd.prior5d : null,
    }
  }

  return result
}

export default async function MacroStrip() {
  let macroData: Record<string, { latest: number; prior5d: number | null }> = {}
  try {
    macroData = await fetchMacroData()
  } catch {
    // no data yet — render empty cells
  }

  return (
    <div
      className="grid grid-cols-4 gap-px rounded border border-border overflow-hidden"
      style={{ background: "#1f2127" }}
    >
      {CELLS.map((cell) => {
        const d = macroData[cell.symbol]
        const current = d?.latest
        const prior = d?.prior5d

        if (current == null) {
          return (
            <div
              key={cell.label}
              className="bg-bg-card flex flex-col items-center justify-center"
              style={{ padding: "8px 4px", minHeight: 72 }}
            >
              <div className="text-text-muted" style={{ fontSize: 9, letterSpacing: "0.06em" }}>
                {cell.label}
              </div>
              <div className="font-mono text-text-muted mt-1" style={{ fontSize: 11 }}>—</div>
            </div>
          )
        }

        const delta = prior != null ? current - prior : 0
        const arrowChar = prior != null ? arrow(delta) : "→"
        const deltaStr = prior != null ? cell.deltaFn(current, prior) : "—"
        const arrowColor = prior != null ? cell.deltaColor(delta) : "#71717a"

        return (
          <div
            key={cell.label}
            className="bg-bg-card flex flex-col items-center justify-center"
            style={{ padding: "8px 4px", minHeight: 72 }}
          >
            <div
              className="text-text-muted uppercase"
              style={{ fontSize: 9, letterSpacing: "0.06em" }}
            >
              {cell.label}
            </div>
            <div className="font-mono text-text mt-1" style={{ fontSize: 12, fontWeight: 600 }}>
              {cell.displayFn(current)}
            </div>
            <div className="font-mono flex items-center gap-0.5 mt-0.5" style={{ fontSize: 10 }}>
              <span style={{ color: arrowColor }}>{arrowChar}</span>
              <span className="text-text-muted">{deltaStr}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
