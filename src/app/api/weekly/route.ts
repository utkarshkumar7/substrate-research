import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import { getHoldingsWithPrices } from "@/lib/queries/holdings"
import { getJournalEntries } from "@/lib/queries/journal"
import { topology, layersInOrder, tickersByLayer, fetchableSymbols } from "@/lib/topology"
import { pctForPeriod, medianPct } from "@/lib/analytics/performance"
import { formatPercent } from "@/lib/format"

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response("ANTHROPIC_API_KEY not configured", { status: 500 })

  const supabase = createClient()
  const anthropic = new Anthropic({ apiKey })
  const today = new Date().toISOString().slice(0, 10)
  const layers = layersInOrder()
  const allSyms = fetchableSymbols()

  const [snapshots, holdings, journalEntries] = await Promise.all([
    getHeatmapSnapshot(supabase, allSyms),
    getHoldingsWithPrices(supabase),
    getJournalEntries(supabase, 20),
  ])

  // Layer health this week (5d)
  const layerHealth = layers.map(l => {
    const syms = tickersByLayer(l.id).filter(t => !t.needsVerification).map(t => t.symbol)
    const pcts = syms.map(s => pctForPeriod(snapshots[s] ?? {} as never, "5d")).filter((v): v is number => v != null)
    return { layer: l, score: medianPct(pcts), tickers: syms.length }
  }).sort((a, b) => b.score - a.score)

  // Top 5 gainers and losers this week
  const movers = allSyms
    .filter(s => snapshots[s]?.pct5d != null)
    .sort((a, b) => (snapshots[b].pct5d ?? 0) - (snapshots[a].pct5d ?? 0))
  const gainers = movers.slice(0, 5).map(s => `${s}: ${formatPercent(snapshots[s].pct5d!, 1)}%`)
  const losers  = movers.slice(-5).reverse().map(s => `${s}: ${formatPercent(snapshots[s].pct5d!, 1)}%`)

  // Portfolio section
  const portfolioSection = holdings.length
    ? `PORTFOLIO (${holdings.length} positions):\n` + holdings.map(h =>
        `  ${h.symbol}: ${h.shares} sh @ $${h.latestPrice?.toFixed(2) ?? "?"} | P&L: ${h.pnlPct != null ? formatPercent(h.pnlPct, 1) + "%" : "—"} | 5d: ${formatPercent(pctForPeriod(snapshots[h.symbol] ?? {} as never, "5d") ?? 0, 1)}%`
      ).join("\n")
    : "PORTFOLIO: no positions entered yet"

  // Open journal entries
  const openEntries = journalEntries.filter(e => e.status !== "closed")
  const journalSection = openEntries.length
    ? `OPEN JOURNAL ENTRIES:\n` + openEntries.map(e => {
        const dir = e.direction ? `(${e.direction})` : ""
        const optParts = (e.direction === "call" || e.direction === "put")
          ? [
              e.strike ? `$${e.strike} strike` : "",
              e.expiry ? `exp ${new Date(e.expiry + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "",
              e.shares ? `${e.shares} contracts` : "",
            ].filter(Boolean).join(", ")
          : (e.shares ? `${e.shares} shares` : "")
        const optStr = optParts ? ` [${optParts}]` : ""
        return `  [${e.status}] ${e.symbol ?? "general"} ${dir}${optStr}: ${e.thesis.slice(0, 150)}`
      }).join("\n")
    : "OPEN JOURNAL ENTRIES: none"

  const prompt = `You are writing a weekly supply chain equity review for a personal trading dashboard. Today: ${today}.

LAYER HEALTH THIS WEEK (5d median):
${layerHealth.map(lh => `  ${lh.layer.name}: ${formatPercent(lh.score, 1)}%`).join("\n")}

TOP GAINERS (5d):
${gainers.map(g => `  ${g}`).join("\n")}

TOP LOSERS (5d):
${losers.map(l => `  ${l}`).join("\n")}

${portfolioSection}

${journalSection}

ALL TOPOLOGY TICKERS: ${allSyms.join(", ")}

Write a structured weekly review with these sections:
1. **Week in review** — 2-3 sentences on the macro tone and which layers led/lagged
2. **Layer breakdown** — for each layer, one sentence on what moved and why (skip layers with no notable action)
3. **Portfolio check** — if positions are present, which ones outperformed/underperformed the layer and why
4. **Open setups** — review each open journal entry: is the thesis still intact? What's changed this week?
5. **Next week watch** — 3-5 specific things to monitor (tickers, macro events, supply chain signals)

Be direct and specific. Use actual percentages. Flag any cross-layer divergences or correlation breaks that are unusual.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)) } catch { /* disconnected */ }
      }

      try {
        let fullText = ""
        const msgStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: [{ type: "text" as const, text: "You are a concise, data-driven equity analyst. Write in markdown with bold section headers.", cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: prompt }],
        })

        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text
            send({ type: "delta", text: event.delta.text })
          }
        }

        // Persist to insights table
        await supabase.from("insights").insert({
          kind: "weekly",
          title: `Weekly Review — ${today}`,
          body: fullText,
          related_symbols: allSyms,
          related_layers: layers.map(l => l.id),
        })

        send({ type: "done" })
      } catch (err) {
        send({ type: "error", message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
