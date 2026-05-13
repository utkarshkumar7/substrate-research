import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import type { CloseRow } from "@/lib/analytics/performance"

/** Fetch all closes for each symbol since `since` date (YYYY-MM-DD), sorted ASC.
 *  Fetches one symbol at a time to stay within Supabase's server-side row limit. */
export async function getPriceHistory(
  client: SupabaseClient<Database>,
  symbols: string[],
  since: string
): Promise<Record<string, CloseRow[]>> {
  const result: Record<string, CloseRow[]> = {}

  await Promise.all(
    symbols.map(async (symbol) => {
      const { data, error } = await client
        .from("prices")
        .select("trade_date, close")
        .eq("symbol", symbol)
        .gte("trade_date", since)
        .order("trade_date", { ascending: true })

      if (error) throw error
      result[symbol] = (data ?? []).map((row) => ({
        date: row.trade_date,
        close: row.close,
      }))
    })
  )

  return result
}
