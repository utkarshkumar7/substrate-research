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
 */
export async function getHeatmapSnapshot(
  client: SupabaseClient<Database>,
  symbols: string[]
): Promise<Record<string, SymbolSnapshot>> {
  // Fetch since start of previous year to cover any YTD calculation
  const yearStart = `${new Date().getFullYear() - 1}-01-01`;

  const { data, error } = await client
    .from("prices")
    .select("symbol, trade_date, close")
    .in("symbol", symbols)
    .gte("trade_date", yearStart)
    .order("trade_date", { ascending: false });

  if (error) throw error;

  const grouped: Record<string, Array<{ date: string; close: number }>> = {};
  for (const row of data ?? []) {
    (grouped[row.symbol] ??= []).push({ date: row.trade_date, close: row.close });
  }

  const result: Record<string, SymbolSnapshot> = {};
  for (const symbol of symbols) {
    const closes = grouped[symbol] ?? [];
    const snap = buildSnapshot(closes);
    if (snap) result[symbol] = snap;
  }
  return result;
}
