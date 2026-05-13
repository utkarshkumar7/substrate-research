"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Layer, Ticker, Edge } from "@/lib/topology/types"
import type { SymbolSnapshot } from "@/lib/analytics/performance"
import { formatPercent } from "@/lib/format"
import { PipelineNode } from "./PipelineNode"
import { PipelineEdge } from "./PipelineEdge"

const NODE_W = 100
const NODE_H = 36
const NODE_Y_STEP = 42   // 36px node + 6px gap
const LAYER_GAP = 22     // extra vertical gap between parallel-layer groups

const COL_X = (order: number) => 60 + order * 220

const SHORT: Record<string, string> = {
  raw_materials:    "Raw Materials",
  energy:           "Energy",
  storage_batteries:"Storage",
  foundries_memory: "Foundries",
  chip_design:      "Chip Design",
  quantum:          "Quantum",
  datacenter_infra: "Datacenter",
  applications:     "Applications",
}

interface NodeInfo {
  x: number; y: number
  symbol: string; name: string; layerId: string
}

function computeLayout(layers: Layer[], tickers: Ticker[]) {
  const byOrder = new Map<number, Layer[]>()
  for (const l of layers) {
    const arr = byOrder.get(l.order) ?? []
    arr.push(l)
    byOrder.set(l.order, arr)
  }

  const nodes: NodeInfo[] = []
  const separators: { x: number; y: number }[] = []
  const colLabels: { x: number; label: string }[] = []

  for (const [order, grp] of [...byOrder.entries()].sort(([a], [b]) => a - b)) {
    const x = COL_X(order)
    // Primary layer (no parallelTo) first
    const sorted = [...grp].sort((a, b) => {
      if (a.parallelTo && !b.parallelTo) return 1
      if (!a.parallelTo && b.parallelTo) return -1
      return a.id.localeCompare(b.id)
    })

    colLabels.push({
      x: x + NODE_W / 2,
      label: sorted.map(l => SHORT[l.id] ?? l.name).join(" / "),
    })

    let y = 60
    for (let li = 0; li < sorted.length; li++) {
      const layerTickers = tickers
        .filter(t => t.layer === sorted[li].id && !t.needsVerification)
        .sort((a, b) => a.symbol.localeCompare(b.symbol))

      for (const t of layerTickers) {
        nodes.push({ x, y, symbol: t.symbol, name: t.name, layerId: sorted[li].id })
        y += NODE_Y_STEP
      }

      if (li < sorted.length - 1) {
        separators.push({ x, y: y + LAYER_GAP / 2 - 1 })
        y += LAYER_GAP
      }
    }
  }

  return { nodes, separators, colLabels }
}

function topDecile(snapshots: Record<string, SymbolSnapshot>): Set<string> {
  const entries = Object.entries(snapshots)
    .filter(([, s]) => s.pct1d != null)
    .sort((a, b) => (b[1].pct1d ?? 0) - (a[1].pct1d ?? 0))
  const n = Math.max(1, Math.ceil(entries.length * 0.1))
  return new Set(entries.slice(0, n).map(([sym]) => sym))
}

interface Props {
  layers: Layer[]
  tickers: Ticker[]
  edges: Edge[]
  snapshots: Record<string, SymbolSnapshot>
}

export default function PipelineCanvas({ layers, tickers, edges, snapshots }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const router = useRouter()

  const { nodes, separators, colLabels } = computeLayout(layers, tickers)
  const posMap = new Map(nodes.map(n => [n.symbol, n]))
  const hot = topDecile(snapshots)

  const connected = hovered
    ? new Set([
        hovered,
        ...edges
          .filter(e => e.from === hovered || e.to === hovered)
          .flatMap(e => [e.from, e.to]),
      ])
    : null

  const svgH = nodes.length ? Math.max(...nodes.map(n => n.y + NODE_H)) + 24 : 200
  const svgW = nodes.length ? Math.max(...nodes.map(n => n.x + NODE_W)) + 20 : 400

  const uniqueLayers = [...new Map(layers.map(l => [l.id, l])).values()]

  const hovSnap = hovered ? snapshots[hovered] : null
  const hovTicker = hovered ? tickers.find(t => t.symbol === hovered) : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: "block" }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {uniqueLayers.map(l => (
            <linearGradient key={l.id} id={`bar-${l.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={l.color} />
              <stop offset="0.04" stopColor={l.color} />
              <stop offset="0.041" stopColor="#16171c" />
              <stop offset="1" stopColor="#16171c" />
            </linearGradient>
          ))}
        </defs>

        {/* Column labels */}
        {colLabels.map((cl, i) => (
          <text
            key={i}
            x={cl.x}
            y={40}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={9}
            fontWeight={500}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {cl.label}
          </text>
        ))}

        {/* Parallel-layer separators */}
        {separators.map((sep, i) => (
          <line
            key={i}
            x1={sep.x} y1={sep.y}
            x2={sep.x + NODE_W} y2={sep.y}
            stroke="#1f2127"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ))}

        {/* Edges — below nodes */}
        {edges.map((edge, i) => {
          const a = posMap.get(edge.from)
          const b = posMap.get(edge.to)
          if (!a || !b) return null
          return (
            <PipelineEdge
              key={i}
              x1={a.x + NODE_W} y1={a.y + NODE_H / 2}
              x2={b.x}          y2={b.y + NODE_H / 2}
              hot={hot.has(edge.from) && hot.has(edge.to)}
              dimmed={hovered != null && edge.from !== hovered && edge.to !== hovered}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <PipelineNode
            key={node.symbol}
            x={node.x} y={node.y}
            symbol={node.symbol}
            name={node.name}
            layerId={node.layerId}
            pct1d={snapshots[node.symbol]?.pct1d ?? null}
            hovered={hovered === node.symbol}
            dimmed={connected != null && !connected.has(node.symbol)}
            onClick={() => router.push(`/ticker/${node.symbol}`)}
            onMouseEnter={() => setHovered(node.symbol)}
          />
        ))}
      </svg>

      {/* Hover info strip */}
      {hovSnap && hovTicker ? (
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border">
          <div className="min-w-0">
            <span className="font-semibold text-text" style={{ fontSize: 13 }}>
              {hovered}
            </span>
            <span className="text-text-muted ml-2 truncate" style={{ fontSize: 12 }}>
              {hovTicker.name}
            </span>
          </div>
          <div className="flex gap-4 shrink-0">
            {(
              [
                { label: "1D",  pct: hovSnap.pct1d  },
                { label: "5D",  pct: hovSnap.pct5d  },
                { label: "1M",  pct: hovSnap.pct1m  },
                { label: "YTD", pct: hovSnap.pctYtd },
              ] as { label: string; pct: number | null }[]
            ).map(({ label, pct }) => (
              <div key={label} className="text-center">
                <div className="text-text-muted" style={{ fontSize: 10 }}>{label}</div>
                <div
                  className="font-mono font-semibold"
                  style={{
                    fontSize: 12,
                    color: pct == null ? "#71717a" : pct >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {pct != null ? formatPercent(pct) + "%" : "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="text-text-muted ml-auto" style={{ fontSize: 11 }}>
            click to open detail
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border text-text-muted" style={{ fontSize: 11 }}>
          <span>Hover a node to highlight supply chain links · click to drill down</span>
        </div>
      )}
    </div>
  )
}
