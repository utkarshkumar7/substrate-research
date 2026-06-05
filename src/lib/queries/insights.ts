import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type InsightRow = Database["public"]["Tables"]["insights"]["Row"]

const SIGNAL_KINDS = ["anomaly", "signal", "flow", "context"]

export async function getRecentInsights(
  client: SupabaseClient<Database>,
  limit = 4
): Promise<InsightRow[]> {
  const { data, error } = await client
    .from("insights")
    .select("id, created_at, kind, title, body, related_symbols, model")
    .in("kind", SIGNAL_KINDS)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as InsightRow[]
}
