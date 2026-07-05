import { unstable_cache } from "next/cache"
import Anthropic from "@anthropic-ai/sdk"

interface Props {
  symbol: string
  name: string
  layerName: string
  pct1d: number | null
  pct5d: number | null
  pct1m: number | null
  pctYtd: number | null
  rsi: number | null
  betaVsSpy: number | null
}

async function fetchClaudeTake(props: Props): Promise<string> {
  const client = new Anthropic()
  const { symbol, name, layerName, pct1d, pct5d, pct1m, pctYtd, rsi, betaVsSpy } = props

  const fmt = (v: number | null) => (v != null ? v.toFixed(1) + "%" : "N/A")

  const prompt = `You are an AI supply chain equity analyst. Give a concise 3-sentence take on ${symbol} (${name}), a company in the ${layerName} layer of the AI supply chain.

Stats: 1D ${fmt(pct1d)} · 5D ${fmt(pct5d)} · 1M ${fmt(pct1m)} · YTD ${fmt(pctYtd)} · RSI(14) ${rsi?.toFixed(1) ?? "N/A"} · Beta vs SPY ${betaVsSpy?.toFixed(2) ?? "N/A"}

Focus on: recent momentum, positioning within the AI supply chain, and one specific risk or opportunity. Be direct and specific. No disclaimers.`

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  })

  return msg.content[0].type === "text" ? msg.content[0].text : ""
}

function getCachedTake(props: Props) {
  const cacheKey = `claude-take-${props.symbol}-${props.pct1d?.toFixed(1)}-${props.pct5d?.toFixed(1)}`
  return unstable_cache(
    () => fetchClaudeTake(props),
    [cacheKey],
    { revalidate: 3600 }
  )()
}

export default async function ClaudeTake(props: Props) {
  let take: string
  try {
    take = await getCachedTake(props)
  } catch {
    return (
      <p className="text-text-muted" style={{ fontSize: 12 }}>
        Claude's take unavailable — check{" "}
        <code className="font-mono" style={{ fontSize: 11 }}>ANTHROPIC_API_KEY</code>
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded font-semibold tracking-wider"
          style={{
            fontSize: 9,
            padding: "2px 6px",
            color: "#f0a24e",
            background: "rgba(240,162,78,0.10)",
            letterSpacing: "0.06em",
          }}
        >
          HAIKU
        </span>
        <span className="text-text-muted" style={{ fontSize: 10 }}>
          cached 1hr
        </span>
      </div>
      <p className="text-text-secondary leading-relaxed" style={{ fontSize: 13 }}>
        {take}
      </p>
    </div>
  )
}
