import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export interface PullbackMetrics {
  symbol: string
  notes: string
  currentPrice: number | null
  high52w: number | null
  pctFrom52wHigh: number | null
  ma50: number | null
  pctFromMa50: number | null
  rsi14: number | null
  ret5d: number | null
  vol30d: number | null
}

function computeRsi14(closes: number[]): number | null {
  if (closes.length < 15) return null
  const recent = closes.slice(0, 15)
  let gains = 0
  let losses = 0
  for (let i = 0; i < 14; i++) {
    const diff = recent[i] - recent[i + 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / 14
  const avgLoss = losses / 14
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function annualizedVol(closes: number[]): number | null {
  if (closes.length < 2) return null
  const logReturns = []
  for (let i = 0; i < closes.length - 1; i++) {
    logReturns.push(Math.log(closes[i] / closes[i + 1]))
  }
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length
  const variance = logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / logReturns.length
  return Math.sqrt(variance * 252) * 100
}

export async function getPullbackMetrics(
  client: SupabaseClient<Database>,
  entries: Array<{ symbol: string; notes: string }>
): Promise<PullbackMetrics[]> {
  const symbols = entries.map((e) => e.symbol)
  const since = new Date()
  since.setFullYear(since.getFullYear() - 1)
  since.setDate(since.getDate() - 10)

  const { data, error } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .in("symbol", symbols)
    .gte("trade_date", since.toISOString().slice(0, 10))
    .order("trade_date", { ascending: false })

  if (error) throw error

  const grouped: Record<string, number[]> = {}
  for (const row of data ?? []) {
    ;(grouped[row.symbol] ??= []).push(row.close)
  }

  return entries.map(({ symbol, notes }) => {
    const closes = grouped[symbol] ?? []
    if (!closes.length) {
      return {
        symbol, notes,
        currentPrice: null, high52w: null, pctFrom52wHigh: null,
        ma50: null, pctFromMa50: null, rsi14: null, ret5d: null, vol30d: null,
      }
    }

    const current = closes[0]
    const high52w = Math.max(...closes.slice(0, 252))
    const ma50 = closes.slice(0, 50).reduce((s, v) => s + v, 0) / Math.min(50, closes.length)
    const prior5d = closes[5] ?? null
    const vol30dCloses = closes.slice(0, 31)

    return {
      symbol,
      notes,
      currentPrice: current,
      high52w,
      pctFrom52wHigh: ((current - high52w) / high52w) * 100,
      ma50,
      pctFromMa50: ((current - ma50) / ma50) * 100,
      rsi14: computeRsi14(closes),
      ret5d: prior5d != null ? ((current - prior5d) / prior5d) * 100 : null,
      vol30d: annualizedVol(vol30dCloses),
    }
  })
}
