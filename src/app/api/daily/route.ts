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

  // Layer health today (1d) and this week (5d)
  const layerHealth = layers.map(l => {
    const syms = tickersByLayer(l.id).filter(t => !t.needsVerification).map(t => t.symbol)
    const pcts1d = syms.map(s => pctForPeriod(snapshots[s] ?? {} as never, "1d")).filter((v): v is number => v != null)
    const pcts5d = syms.map(s => pctForPeriod(snapshots[s] ?? {} as never, "5d")).filter((v): v is number => v != null)
    return { layer: l, score1d: medianPct(pcts1d), score5d: medianPct(pcts5d) }
  }).sort((a, b) => b.score1d - a.score1d)

  // Today's movers (1d)
  const movers = allSyms
    .filter(s => snapshots[s]?.pct1d != null)
    .sort((a, b) => Math.abs(snapshots[b].pct1d ?? 0) - Math.abs(snapshots[a].pct1d ?? 0))
  const topMovers = movers.slice(0, 10).map(s => {
    const snap = snapshots[s]
    return `  ${s}: ${formatPercent(snap.pct1d!, 1)}% → $${snap.latest.toFixed(2)}`
  })

  // Portfolio today
  const portfolioSection = holdings.length
    ? `PORTFOLIO TODAY:\n` + holdings.map(h => {
        const snap = snapshots[h.symbol]
        const today1d = pctForPeriod(snap ?? {} as never, "1d")
        const dayPnl = today1d != null && h.latestPrice != null
          ? (today1d / 100) * h.latestPrice * h.shares
          : null
        return `  ${h.symbol}: ${h.shares} sh @ $${h.latestPrice?.toFixed(2) ?? "?"} | today: ${today1d != null ? formatPercent(today1d, 1) + "%" : "—"} | day P&L: ${dayPnl != null ? (dayPnl >= 0 ? "+" : "") + "$" + Math.abs(dayPnl).toFixed(0) : "—"} | total P&L: ${h.pnlPct != null ? formatPercent(h.pnlPct, 1) + "%" : "—"}`
      }).join("\n")
    : "PORTFOLIO: no positions entered"

  // Open journal entries — highlight if underlying moved meaningfully today
  const openEntries = journalEntries.filter(e => e.status !== "closed")
  const journalSection = openEntries.length
    ? `OPEN SETUPS:\n` + openEntries.map(e => {
        const snap = e.symbol ? snapshots[e.symbol] : null
        const move = snap ? pctForPeriod(snap, "1d") : null
        const dir = e.direction ? `(${e.direction})` : ""
        const optParts = (e.direction === "call" || e.direction === "put")
          ? [
              e.strike ? `$${e.strike} strike` : "",
              e.expiry ? `exp ${new Date(e.expiry + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "",
            ].filter(Boolean).join(", ")
          : ""
        const optStr = optParts ? ` [${optParts}]` : ""
        const moveStr = move != null ? ` | underlying today: ${formatPercent(move, 1)}%` : ""
        return `  [${e.status}] ${e.symbol ?? "general"} ${dir}${optStr}${moveStr}: ${e.thesis.slice(0, 120)}`
      }).join("\n")
    : "OPEN SETUPS: none"

  const prompt = `You are writing a daily EOD equity brief for a personal AI supply chain trading dashboard. Today: ${today}.

LAYER PERFORMANCE TODAY (1d median → 5d context):
${layerHealth.map(lh => `  ${lh.layer.name}: ${formatPercent(lh.score1d, 1)}% today | ${formatPercent(lh.score5d, 1)}% 5d`).join("\n")}

TOP MOVERS TODAY (by absolute 1d move):
${topMovers.join("\n")}

${portfolioSection}

${journalSection}

Write a structured daily brief with these sections:
1. **Today's tape** — 2-3 sentences on the day's tone, which layers led/lagged, any cross-layer divergences
2. **Notable moves** — call out 3-5 tickers with meaningful moves and explain the supply chain context (upstream/downstream implications)
3. **Portfolio** — if positions exist, flag any that moved significantly today and whether the thesis is intact or challenged
4. **Open setups** — for each open journal entry: did today's action strengthen or weaken the thesis? Be direct.
5. **Watch tomorrow** — 2-3 specific things: tickers near key levels, macro events, supply chain signals to monitor

Keep it tight and actionable. Use actual numbers. No filler.`

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
          max_tokens: 1500,
          system: [{
            type: "text" as const,
            text: "You are a concise, data-driven equity analyst writing a daily EOD brief. Write in markdown with bold section headers. Be direct and specific — no generic market commentary.",
            cache_control: { type: "ephemeral" },
          }],
          messages: [{ role: "user", content: prompt }],
        })

        for await (const event of msgStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text
            send({ type: "delta", text: event.delta.text })
          }
        }

        await supabase.from("insights").insert({
          kind: "daily",
          title: `Daily Brief — ${today}`,
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
