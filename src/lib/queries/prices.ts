import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { buildSnapshot, type SymbolSnapshot } from "@/lib/analytics/performance";

/**
 * Returns latest close and N-day-ago close for every symbol in one query.
 * `daysBack` is a calendar-day window used for the prior price lookup.
 */
export async function getRecentCloses(
  client: SupabaseClient<Database>,
  daysBack = 30
): Promise<Record<string, { latest: number; latestDate: string; prior: number | null }>> {
  const since = new Date();
  since.setDate(since.getDate() - (daysBack + 10)); // +10 buffer for weekends/holidays

  const { data, error } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .gte("trade_date", since.toISOString().slice(0, 10))
    .order("trade_date", { ascending: false });

  if (error) throw error;

  const grouped: Record<string, Array<{ date: string; close: number }>> = {};
  for (const row of data ?? []) {
    (grouped[row.symbol] ??= []).push({ date: row.trade_date, close: row.close });
  }

  const result: Record<string, { latest: number; latestDate: string; prior: number | null }> = {};
  for (const [symbol, closes] of Object.entries(grouped)) {
    // closes is already desc-sorted from the query
    result[symbol] = {
      latest: closes[0].close,
      latestDate: closes[0].date,
      prior: closes[closes.length - 1]?.close ?? null,
    };
  }
  return result;
}

/**
 * Fetches enough history to compute 1d/5d/1m/YTD % changes for each symbol.
 * Returns a SymbolSnapshot per symbol.
 *
 * Uses a server-side RPC to avoid the PostgREST 1000-row cap (28k+ rows for 80 symbols).
 */
export async function getHeatmapSnapshot(
  client: SupabaseClient<Database>,
  symbols: string[]
): Promise<Record<string, SymbolSnapshot>> {
  const { data, error } = await client.rpc("get_heatmap_snapshots", {
    p_symbols: symbols,
  });

  if (error) throw error;

  const result: Record<string, SymbolSnapshot> = {};
  for (const row of data ?? []) {
    result[row.symbol] = {
      latest: row.latest_close,
      latestDate: row.latest_date,
      pct1d: row.pct_1d ?? null,
      pct5d: row.pct_5d ?? null,
      pct1m: row.pct_1m ?? null,
      pctYtd: row.pct_ytd ?? null,
    };
  }
  return result;
}
