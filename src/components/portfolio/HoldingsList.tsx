import { createClient } from "@/lib/supabase/server"
import { getHoldingsWithPrices } from "@/lib/queries/holdings"
import { formatCurrency, formatPercent } from "@/lib/format"

export default async function HoldingsList() {
  const client = createClient()
  const holdings = await getHoldingsWithPrices(client)

  if (!holdings.length) {
    return (
      <p className="text-text-muted" style={{ fontSize: 11 }}>
        No positions — add via{" "}
        <a href="/portfolio" className="text-accent hover:opacity-80 transition-opacity">
          Portfolio
        </a>
      </p>
    )
  }

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0)

  return (
    <div>
      {holdings.map((h) => (
        <a
          key={h.symbol}
          href={`/ticker/${h.symbol}`}
          className="flex items-center justify-between rounded-lg hover:bg-bg-hover transition-colors"
          style={{ padding: "6px 8px", marginBottom: 2, textDecoration: "none" }}
        >
          <div>
            <span className="font-semibold text-text" style={{ fontSize: 12 }}>
              {h.symbol}
            </span>
            <span className="text-text-muted ml-1.5" style={{ fontSize: 11 }}>
              {h.shares % 1 === 0 ? h.shares.toFixed(0) : h.shares.toFixed(2)} sh
            </span>
          </div>
          <div className="text-right">
            <div className="font-mono text-text" style={{ fontSize: 12 }}>
              {h.latestPrice ? formatCurrency(h.currentValue) : "—"}
            </div>
            {h.pnlPct != null && (
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: h.pnlPct >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {formatPercent(h.pnlPct)}%
              </div>
            )}
          </div>
        </a>
      ))}

      {/* Total */}
      <div
        className="flex items-center justify-between border-t border-border mt-2 pt-2"
      >
        <span className="text-text-muted" style={{ fontSize: 10 }}>
          TOTAL
        </span>
        <span className="font-mono font-semibold text-text" style={{ fontSize: 12 }}>
          {formatCurrency(totalValue)}
        </span>
      </div>
    </div>
  )
}
