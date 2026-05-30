import { createClient } from "@/lib/supabase/server"
import { getJournalEntries } from "@/lib/queries/journal"
import JournalClient from "./JournalClient"

export const metadata = { title: "Trade Journal" }

export default async function JournalPage() {
  const client = createClient()
  const entries = await getJournalEntries(client)

  return <JournalClient initialEntries={entries} />
}
