import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type PriceMatrix = Record<string, number[]> // symbol → closes ASC

/** Fetch last `daysBack` calendar days of closes for given symbols, returns per-symbol close arrays (oldest first). */
export async function getPriceMatrix(
  client: SupabaseClient<Database>,
  symbols: string[],
  daysBack: number
): Promise<PriceMatrix> {
  const since = new Date()
  since.setDate(since.getDate() - daysBack - 14) // +14 buffer for weekends/holidays

  const { data, error } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .in("symbol", symbols)
    .gte("trade_date", since.toISOString().slice(0, 10))
    .order("trade_date", { ascending: true })

  if (error) throw error

  const grouped: Record<string, number[]> = {}
  for (const row of data ?? []) {
    ;(grouped[row.symbol] ??= []).push(row.close)
  }

  // Only keep symbols with at least 10 data points
  const result: PriceMatrix = {}
  for (const [sym, closes] of Object.entries(grouped)) {
    if (closes.length >= 10) result[sym] = closes
  }
  return result
}

/** Pearson correlation of two return series (computed from close arrays). */
export function pearsonReturns(closesA: number[], closesB: number[], window?: number): number | null {
  const len = window ? window + 1 : Math.min(closesA.length, closesB.length)
  const a = closesA.slice(-len)
  const b = closesB.slice(-len)
  const n = Math.min(a.length, b.length) - 1
  if (n < 5) return null

  const retsA = a.slice(1).map((v, i) => v / a[i] - 1)
  const retsB = b.slice(1).map((v, i) => v / b[i] - 1)

  const ma = retsA.reduce((s, x) => s + x, 0) / n
  const mb = retsB.reduce((s, x) => s + x, 0) / n

  let cov = 0, va = 0, vb = 0
  for (let i = 0; i < n; i++) {
    const da = retsA[i] - ma
    const db = retsB[i] - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  if (va === 0 || vb === 0) return null
  return Math.max(-1, Math.min(1, cov / Math.sqrt(va * vb)))
}

export interface DecoupledPair {
  sym1: string
  sym2: string
  layer1: string
  layer2: string
  corr90d: number
  corr5d: number
  delta: number // corr5d - corr90d
}

/** Find pairs with highest |short_corr - long_corr| among meaningful baseline pairs. */
export function findDecoupledPairs(
  matrix: PriceMatrix,
  symbolLayer: Record<string, string>,
  longWindow = 90,
  shortWindow = 5,
  minBaseline = 0.4,
  topN = 20
): DecoupledPair[] {
  const symbols = Object.keys(matrix)
  const results: DecoupledPair[] = []

  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const s1 = symbols[i]
      const s2 = symbols[j]
      const c90 = pearsonReturns(matrix[s1], matrix[s2], longWindow)
      const c5 = pearsonReturns(matrix[s1], matrix[s2], shortWindow)
      if (c90 == null || c5 == null) continue
      if (Math.abs(c90) < minBaseline) continue

      results.push({
        sym1: s1,
        sym2: s2,
        layer1: symbolLayer[s1] ?? "",
        layer2: symbolLayer[s2] ?? "",
        corr90d: c90,
        corr5d: c5,
        delta: c5 - c90,
      })
    }
  }

  results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return results.slice(0, topN)
}
