import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"]
export type JournalInsert = Database["public"]["Tables"]["journal_entries"]["Insert"]

export async function getJournalEntries(
  client: SupabaseClient<Database>,
  limit = 50
): Promise<JournalEntry[]> {
  const { data, error } = await client
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function insertJournalEntry(
  client: SupabaseClient<Database>,
  entry: JournalInsert
): Promise<JournalEntry> {
  const { data, error } = await client
    .from("journal_entries")
    .insert(entry)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateJournalEntry(
  client: SupabaseClient<Database>,
  id: string,
  updates: Partial<JournalInsert>
): Promise<void> {
  const { error } = await client
    .from("journal_entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function deleteJournalEntry(
  client: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await client.from("journal_entries").delete().eq("id", id)
  if (error) throw error
}
