import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export interface HoldingRow {
  symbol: string
  shares: number
  costBasis: number | null
  latestPrice: number | null
  latestDate: string | null
  currentValue: number
  pnlPct: number | null
}

export async function getHoldingsWithPrices(
  client: SupabaseClient<Database>
): Promise<HoldingRow[]> {
  const { data: holdings, error: hErr } = await client
    .from("holdings")
    .select("symbol, shares, cost_basis")

  if (hErr) throw hErr
  if (!holdings?.length) return []

  const symbols = holdings.map((h) => h.symbol)

  const { data: prices, error: pErr } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .in("symbol", symbols)
    .order("trade_date", { ascending: false })

  if (pErr) throw pErr

  const latest: Record<string, { close: number; date: string }> = {}
  for (const row of prices ?? []) {
    if (!latest[row.symbol]) {
      latest[row.symbol] = { close: Number(row.close), date: row.trade_date }
    }
  }

  return holdings
    .map((h) => {
      const price = latest[h.symbol] ?? null
      const currentValue = price ? Number(h.shares) * price.close : 0
      const pnlPct =
        h.cost_basis != null && price
          ? ((price.close - Number(h.cost_basis)) / Number(h.cost_basis)) * 100
          : null
      return {
        symbol: h.symbol,
        shares: Number(h.shares),
        costBasis: h.cost_basis != null ? Number(h.cost_basis) : null,
        latestPrice: price?.close ?? null,
        latestDate: price?.date ?? null,
        currentValue,
        pnlPct,
      }
    })
    .sort((a, b) => b.currentValue - a.currentValue)
}
