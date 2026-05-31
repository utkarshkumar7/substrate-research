import { createClient } from "@/lib/supabase/server"
import DailyClient from "./DailyClient"

export const metadata = { title: "Daily Brief" }

async function getDailyReports() {
  const client = createClient()
  const { data } = await client
    .from("insights")
    .select("id, title, body, created_at")
    .eq("kind", "daily")
    .order("created_at", { ascending: false })
    .limit(7)
  return data ?? []
}

export default async function DailyPage() {
  const reports = await getDailyReports()
  return <DailyClient reports={reports} />
}
