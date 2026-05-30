import { createClient } from "@/lib/supabase/server"
import WeeklyClient from "./WeeklyClient"

export const metadata = { title: "Weekly Review" }

async function getLatestWeekly() {
  const client = createClient()
  const { data } = await client
    .from("insights")
    .select("id, title, body, created_at")
    .eq("kind", "weekly")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export default async function WeeklyPage() {
  const latest = await getLatestWeekly()
  return <WeeklyClient latest={latest} />
}
