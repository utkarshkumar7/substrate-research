import { createClient } from "@/lib/supabase/server"
import { getJournalEntries } from "@/lib/queries/journal"
import JournalClient from "./JournalClient"

export const metadata = { title: "Trade Journal" }

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { symbol?: string; status?: string; direction?: string }
}) {
  const client = createClient()
  const entries = await getJournalEntries(client)

  // Fetch latest prices for open option entries to compute moneyness
  const openOptionSymbols = [...new Set(
    entries
      .filter(e => e.status !== "closed" && (e.direction === "call" || e.direction === "put") && e.symbol && e.strike)
      .map(e => e.symbol!)
  )]

  let latestPrices: Record<string, number> = {}
  if (openOptionSymbols.length > 0) {
    const { data } = await client
      .from("prices")
      .select("symbol, close, trade_date")
      .in("symbol", openOptionSymbols)
      .order("trade_date", { ascending: false })
    if (data) {
      for (const row of data) {
        if (!(row.symbol in latestPrices)) latestPrices[row.symbol] = row.close
      }
    }
  }

  const prefill = searchParams.symbol
    ? {
        symbol: searchParams.symbol,
        status: searchParams.status ?? "watching",
        direction: searchParams.direction ?? "long",
      }
    : undefined

  return (
    <JournalClient
      initialEntries={entries}
      latestPrices={latestPrices}
      prefill={prefill}
    />
  )
}
