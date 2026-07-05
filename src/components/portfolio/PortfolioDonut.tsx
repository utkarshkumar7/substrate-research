"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/format"

export interface LayerSlice {
  layer: string
  label: string
  value: number
  color: string
  pct: number
}

interface Props {
  slices: LayerSlice[]
}

const R = 72
const R_INNER = 48
const CX = 90
const CY = 90
const SIZE = 180

function r4(n: number) { return Math.round(n * 10000) / 10000 }

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: r4(cx + r * Math.cos(rad)), y: r4(cy + r * Math.sin(rad)) }
}

function slicePath(cx: number, cy: number, r: number, ri: number, startDeg: number, endDeg: number) {
  const large = endDeg - startDeg > 180 ? 1 : 0
  const o1 = polarToXY(cx, cy, r, startDeg)
  const o2 = polarToXY(cx, cy, r, endDeg)
  const i1 = polarToXY(cx, cy, ri, endDeg)
  const i2 = polarToXY(cx, cy, ri, startDeg)
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${r} ${r} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${ri} ${ri} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ")
}

export default function PortfolioDonut({ slices }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (!slices.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: 120 }}>
        <span className="text-text-muted" style={{ fontSize: 12 }}>No holdings yet</span>
      </div>
    )
  }

  const GAP_DEG = slices.length > 1 ? 2 : 0
  const total = slices.reduce((s, sl) => s + sl.pct, 0)
  const segments: Array<{ slice: LayerSlice; start: number; end: number }> = []
  let cursor = 0
  for (const sl of slices) {
    const span = (sl.pct / total) * (360 - GAP_DEG * slices.length)
    segments.push({ slice: sl, start: cursor, end: cursor + span })
    cursor += span + GAP_DEG
  }

  const hoveredSlice = hovered ? slices.find((s) => s.layer === hovered) : null
  const totalValue = slices.reduce((s, sl) => s + sl.value, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG donut */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {segments.map(({ slice, start, end }) => (
          <path
            key={slice.layer}
            d={slicePath(CX, CY, R, R_INNER, start, end)}
            fill={slice.color}
            opacity={hovered && hovered !== slice.layer ? 0.25 : 1}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(slice.layer)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Center label */}
        {hoveredSlice ? (
          <>
            <text x={CX} y={CY - 8} textAnchor="middle" fill="#e8e9ec" fontSize={14} fontWeight={600}>
              {hoveredSlice.pct.toFixed(1)}%
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" fill="#6b7280" fontSize={9} fontFamily="monospace">
              {formatCurrency(hoveredSlice.value)}
            </text>
          </>
        ) : (
          <>
            <text x={CX} y={CY - 5} textAnchor="middle" fill="#e8e9ec" fontSize={12} fontWeight={600}>
              {formatCurrency(totalValue)}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill="#6b7280" fontSize={9}>
              {slices.length} layers
            </text>
          </>
        )}
      </svg>

      {/* Legend grid — 2 columns */}
      <div className="w-full grid gap-x-4 gap-y-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {slices.map((s) => (
          <div
            key={s.layer}
            className="flex items-start gap-2 cursor-default"
            style={{ opacity: hovered && hovered !== s.layer ? 0.3 : 1, transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(s.layer)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="rounded-sm shrink-0 mt-0.5" style={{ width: 8, height: 8, background: s.color }} />
            <div className="min-w-0">
              <div className="text-text-secondary leading-tight" style={{ fontSize: 11 }}>{s.label}</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono font-semibold text-text" style={{ fontSize: 12 }}>{s.pct.toFixed(1)}%</span>
                <span className="font-mono text-text-muted" style={{ fontSize: 10 }}>{formatCurrency(s.value)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
