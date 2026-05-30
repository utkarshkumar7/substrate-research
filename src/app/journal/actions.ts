"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { insertJournalEntry, updateJournalEntry, deleteJournalEntry } from "@/lib/queries/journal"
import type { JournalInsert } from "@/lib/queries/journal"

export async function addEntry(entry: JournalInsert) {
  const client = createClient()
  await insertJournalEntry(client, entry)
  revalidatePath("/journal")
}

export async function updateEntry(id: string, updates: Partial<JournalInsert>) {
  const client = createClient()
  await updateJournalEntry(client, id, updates)
  revalidatePath("/journal")
}

export async function removeEntry(id: string) {
  const client = createClient()
  await deleteJournalEntry(client, id)
  revalidatePath("/journal")
}
