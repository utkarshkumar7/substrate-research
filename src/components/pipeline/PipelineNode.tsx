import { formatPercent } from "@/lib/format"

const NODE_W = 100
const NODE_H = 36

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s
}

interface Props {
  x: number
  y: number
  symbol: string
  name: string
  layerId: string
  pct1d: number | null
  hovered: boolean
  dimmed: boolean
  onClick: () => void
  onMouseEnter: () => void
}

export function PipelineNode({
  x, y, symbol, name, layerId, pct1d, hovered, dimmed, onClick, onMouseEnter,
}: Props) {
  const pctColor =
    pct1d == null ? "#71717a" : pct1d >= 0 ? "#4ade80" : "#f87171"
  const pctText = pct1d != null ? formatPercent(pct1d) + "%" : "—"

  return (
    <g
      transform={`translate(${x},${y})`}
      opacity={dimmed ? 0.18 : 1}
      style={{ cursor: "pointer" }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <rect
        x={0} y={0}
        width={NODE_W} height={NODE_H}
        rx={4}
        fill={`url(#bar-${layerId})`}
        stroke={hovered ? "#2a2c33" : "#1f2127"}
        strokeWidth={1}
      />
      {hovered && (
        <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={4} fill="white" fillOpacity={0.05} />
      )}
      <text
        x={9} y={14}
        fill="#e8e9ec"
        fontSize={10}
        fontWeight={600}
        fontFamily="Menlo, ui-monospace, monospace"
        style={{ pointerEvents: "none" }}
      >
        {symbol}
      </text>
      <text
        x={97} y={14}
        fill={pctColor}
        fontSize={9}
        fontFamily="Menlo, ui-monospace, monospace"
        textAnchor="end"
        style={{ pointerEvents: "none" }}
      >
        {pctText}
      </text>
      <text
        x={9} y={27}
        fill="#6b7280"
        fontSize={9}
        fontFamily="Inter, system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {trunc(name, 14)}
      </text>
    </g>
  )
}
