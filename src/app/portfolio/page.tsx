import { createClient } from "@/lib/supabase/server"
import { TOPOLOGY } from "@/lib/topology/topology.generated"
import PortfolioClient, { type PortfolioHolding } from "@/components/portfolio/PortfolioClient"
import type { LayerSlice } from "@/components/portfolio/PortfolioDonut"

const LAYER_COLORS: Record<string, string> = {
  raw_materials:    "#b45309",
  energy:           "#ea580c",
  storage_batteries:"#e11d48",
  foundries_memory: "#2563eb",
  chip_design:      "#4f46e5",
  quantum:          "#7c3aed",
  photonics:        "#0ea5e9",
  datacenter_infra: "#0d9488",
  applications:     "#16a34a",
}

const LAYER_LABELS: Record<string, string> = {
  raw_materials:    "Raw Materials",
  energy:           "Energy",
  storage_batteries:"Storage",
  foundries_memory: "Foundries & Memory",
  chip_design:      "Chip Design",
  quantum:          "Quantum",
  photonics:        "Photonics",
  datacenter_infra: "Datacenter",
  applications:     "Applications",
}

export default async function PortfolioPage() {
  const client = createClient()

  const { data: rawHoldings } = await client
    .from("holdings")
    .select("symbol, shares, cost_basis, notes, updated_at")

  if (!rawHoldings?.length) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div className="mb-6">
          <h1 className="font-semibold tracking-tight text-text" style={{ fontSize: 20 }}>Portfolio</h1>
          <p className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>Track your supply-chain positions</p>
        </div>
        <PortfolioClient
          holdings={[]}
          slices={[]}
          totalValue={0}
          totalCost={null}
          totalPnl={null}
          totalPnlPct={null}
        />
      </div>
    )
  }

  // Fetch latest price for each symbol individually (avoids 1000-row server limit)
  const latestPrices: Record<string, number> = {}
  await Promise.all(
    rawHoldings.map(async (h) => {
      const { data } = await client
        .from("prices")
        .select("close")
        .eq("symbol", h.symbol)
        .order("trade_date", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) latestPrices[h.symbol] = Number(data.close)
    })
  )

  // Build ticker lookup from topology
  const tickerMeta: Record<string, { name: string; layer: string }> = {}
  for (const t of TOPOLOGY.tickers) {
    tickerMeta[t.symbol] = { name: t.name, layer: t.layer }
  }

  const holdings: PortfolioHolding[] = rawHoldings
    .map((h) => {
      const meta = tickerMeta[h.symbol] ?? { name: h.symbol, layer: "applications" }
      const price = latestPrices[h.symbol] ?? null
      const shares = Number(h.shares)
      const costBasis = h.cost_basis != null ? Number(h.cost_basis) : null
      const currentValue = price != null ? shares * price : 0
      const costTotal = costBasis != null ? shares * costBasis : null
      const pnlAbs = costTotal != null && price != null ? currentValue - costTotal : null
      const pnlPct =
        costBasis != null && price != null
          ? ((price - costBasis) / costBasis) * 100
          : null

      return {
        symbol: h.symbol,
        name: meta.name,
        layer: meta.layer,
        layerLabel: LAYER_LABELS[meta.layer] ?? meta.layer,
        layerColor: LAYER_COLORS[meta.layer] ?? "#6b7280",
        shares,
        costBasis,
        notes: h.notes,
        latestPrice: price,
        currentValue,
        pnlPct,
        pnlAbs,
      }
    })
    .sort((a, b) => b.currentValue - a.currentValue)

  // Aggregate totals
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const holdingsWithCost = holdings.filter((h) => h.costBasis != null)
  const totalCost =
    holdingsWithCost.length > 0
      ? holdingsWithCost.reduce((s, h) => s + h.shares * h.costBasis!, 0)
      : null
  const totalPnl = totalCost != null ? totalValue - totalCost : null
  const totalPnlPct =
    totalCost != null && totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : null

  // Layer allocation slices
  const layerMap: Record<string, number> = {}
  for (const h of holdings) {
    layerMap[h.layer] = (layerMap[h.layer] ?? 0) + h.currentValue
  }
  const slices: LayerSlice[] = Object.entries(layerMap)
    .filter(([, v]) => v > 0)
    .map(([layer, value]) => ({
      layer,
      label: LAYER_LABELS[layer] ?? layer,
      value,
      color: LAYER_COLORS[layer] ?? "#6b7280",
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div style={{ padding: "28px 32px" }}>
      <div className="mb-6">
        <h1 className="font-semibold tracking-tight text-text" style={{ fontSize: 20 }}>Portfolio</h1>
        <p className="text-text-muted mt-0.5" style={{ fontSize: 12 }}>
          {holdings.length} position{holdings.length !== 1 ? "s" : ""} · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <PortfolioClient
        holdings={holdings}
        slices={slices}
        totalValue={totalValue}
        totalCost={totalCost}
        totalPnl={totalPnl}
        totalPnlPct={totalPnlPct}
      />
    </div>
  )
}
