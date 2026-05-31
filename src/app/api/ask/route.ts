import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { getHeatmapSnapshot } from "@/lib/queries/prices"
import { getRecentInsights } from "@/lib/queries/insights"
import { getHoldingsWithPrices } from "@/lib/queries/holdings"
import { getJournalEntries } from "@/lib/queries/journal"
import { topology, layersInOrder, tickersByLayer, fetchableSymbols } from "@/lib/topology"
import { pctForPeriod, medianPct } from "@/lib/analytics/performance"
import { formatPercent } from "@/lib/format"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

// ─── System prompt ────────────────────────────────────────────────────────────

async function buildSystemPrompt(supabase: SupabaseClient<Database>): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const layers = layersInOrder()

  // Topology (layer names + tickers per layer — no edges, keeps prompt short)
  const layerLines = layers.map((l) => `  ${l.name}: ${l.description}`).join("\n")
  const byLayer: Record<string, string[]> = {}
  for (const t of topology.tickers.filter((t) => !t.needsVerification)) {
    ;(byLayer[t.layer] ??= []).push(t.symbol)
  }
  const tickerLines = Object.entries(byLayer)
    .map(([lid, syms]) => `  ${lid}: ${syms.join(", ")}`)
    .join("\n")

  // Layer health (5d median)
  const allSyms = fetchableSymbols()
  const snapshots = await getHeatmapSnapshot(supabase, allSyms)
  const healthLines = layers
    .map((l) => {
      const syms = tickersByLayer(l.id)
        .filter((t) => !t.needsVerification)
        .map((t) => t.symbol)
      const pcts = syms
        .map((s) => pctForPeriod(snapshots[s] ?? ({} as never), "5d"))
        .filter((v): v is number => v != null)
      return `  ${l.name}: ${formatPercent(medianPct(pcts), 1)}%`
    })
    .join("\n")

  // Top movers today (1d, absolute magnitude)
  const movers = allSyms
    .filter((s) => snapshots[s]?.pct1d != null)
    .sort((a, b) => Math.abs(snapshots[b].pct1d!) - Math.abs(snapshots[a].pct1d!))
    .slice(0, 8)
    .map((s) => {
      const snap = snapshots[s]
      return `  ${s}: ${formatPercent(snap.pct1d!, 1)}% (1d)  $${snap.latest.toFixed(2)}`
    })
    .join("\n")

  // Recent signals
  const insights = await getRecentInsights(supabase, 4)
  const signalLines = insights.length
    ? insights.map((i) => `  [${i.kind}] ${i.title}`).join("\n")
    : "  none"

  // User holdings + journal
  const [holdings, journalEntries] = await Promise.all([
    getHoldingsWithPrices(supabase),
    getJournalEntries(supabase, 10),
  ])
  const holdingsSection = holdings.length
    ? `\nUSER HOLDINGS:\n${holdings
        .map((h) => `  ${h.symbol}: ${h.shares} sh  $${h.latestPrice?.toFixed(2) ?? "?"}  P&L: ${h.pnlPct != null ? formatPercent(h.pnlPct, 1) + "%" : "—"}`)
        .join("\n")}`
    : ""

  const openJournal = journalEntries.filter(e => e.status !== "closed")
  const journalSection = openJournal.length
    ? `\nOPEN TRADE JOURNAL:\n${openJournal
        .map(e => {
          const dir = e.direction ? `(${e.direction})` : ""
          const optParts = (e.direction === "call" || e.direction === "put")
            ? [e.strike ? `$${e.strike}` : "", e.expiry ? `exp ${new Date(e.expiry + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""].filter(Boolean).join(" ")
            : ""
          const optStr = optParts ? ` ${optParts}` : ""
          return `  [${e.status}] ${e.symbol ?? "general"} ${dir}${optStr}: ${e.thesis.slice(0, 200)}`
        })
        .join("\n")}`
    : ""

  return `You are an AI supply chain equity analyst for a personal research dashboard. Today: ${today}.

The dashboard tracks ~65 equities across the AI supply chain from silicon to chatbot.

SUPPLY CHAIN LAYERS (order: raw materials → energy/storage → foundries → chip design/photonics → datacenter → apps):
${layerLines}

TICKERS BY LAYER:
${tickerLines}

CURRENT LAYER HEALTH (5d median return):
${healthLines}

TOP MOVERS TODAY (1d):
${movers}

RECENT SIGNALS:
${signalLines}${holdingsSection}${journalSection}

Answer using specific tickers and layers from the data above. Be concise and direct.

The user may paste two structured input types for analysis:

1. OPTION CONTRACT — shape like:
   "Should I buy [TICKER] [EXP_DATE] $[STRIKE] [CALL/PUT] at $[PRICE]?
    Bid $X, ask $Y, IV Z%, volume V, OI N."

   When you see this, your job is:
   - Pull the underlying's current price and 1Y action from context
   - Note distance from 52w high, RSI, recent volatility regime
   - Reference the underlying's supply chain position (upstream/downstream, layer health)
   - Comment on whether the user is doubling down on existing exposure or adding new
   - Note if IV looks rich relative to recent realized vol (you can estimate this from the price history)
   - DO NOT compute Greeks precisely — you don't have an options feed. Comment qualitatively.
   - End with: "Not financial advice. Verify with current data before executing."

2. SIGNAL / TWEET — paste of tweet content, often referencing a setup or thesis.
   When you see this, your job is:
   - Identify which tickers/layers the signal touches
   - Cross-reference against the user's topology and current holdings
   - Note if the signal aligns or conflicts with the dashboard's current view (layer health, anomalies)
   - Be skeptical: signals from Twitter are noisy. Flag obvious red flags (promotion of micro-caps, no specific thesis, vague predictions).
   - Suggest what to check next, not what to do.`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { conversation_id, user_message } = await req.json()

  if (!user_message?.trim()) {
    return new Response("Missing user_message", { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 })
  }

  const supabase = createClient()
  const anthropic = new Anthropic({ apiKey })

  // Get or create conversation
  let convId: string = conversation_id
  if (!convId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ title: user_message.slice(0, 60) })
      .select("id")
      .single()
    if (error || !data) return new Response("Failed to create conversation", { status: 500 })
    convId = data.id
  }

  // Save user message
  await supabase
    .from("messages")
    .insert({ conversation_id: convId, role: "user", content: user_message })

  // Load most recent 30 messages (newest-first, then reverse to get chronological order)
  const { data: historyDesc } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: false })
    .limit(30)
  const history = (historyDesc ?? []).reverse()

  // Build context
  const systemPrompt = await buildSystemPrompt(supabase)

  const anthropicMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }))

  // Stream
  const encoder = new TextEncoder()
  let fullText = ""

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      try {
        send({ type: "init", conversation_id: convId })

        const msgStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: [
            {
              type: "text" as const,
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: anthropicMessages,
        })

        for await (const event of msgStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text
            send({ type: "delta", text: event.delta.text })
          }
        }

        // Persist assistant reply
        await supabase
          .from("messages")
          .insert({ conversation_id: convId, role: "assistant", content: fullText })

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
