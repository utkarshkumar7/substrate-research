interface Props {
  x1: number
  y1: number
  x2: number
  y2: number
  hot: boolean
  dimmed: boolean
}

export function PipelineEdge({ x1, y1, x2, y2, hot, dimmed }: Props) {
  const mx = (x1 + x2) / 2
  return (
    <path
      d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
      fill="none"
      stroke={hot ? "#22d3ee" : "#9ca3af"}
      strokeWidth={hot ? 1.5 : 1}
      opacity={dimmed ? 0.05 : hot ? 0.7 : 0.28}
      strokeLinecap="round"
    />
  )
}
