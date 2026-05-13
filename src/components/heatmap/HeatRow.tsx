import HeatCell from "./HeatCell";

interface Props {
  layerName: string;
  layerColor: string;
  symbols: string[];
  snapshots: Record<string, { pct: number | null }>;
}

export default function HeatRow({ layerName, layerColor, symbols, snapshots }: Props) {
  return (
    <div className="grid items-center gap-3 mb-1.5" style={{ gridTemplateColumns: "140px 1fr" }}>
      <div className="flex items-center gap-1.5 text-text-secondary" style={{ fontSize: 11 }}>
        <span
          className="shrink-0 rounded-sm"
          style={{ width: 8, height: 8, background: layerColor }}
        />
        {layerName}
      </div>
      <div className="flex gap-1 flex-wrap">
        {symbols.map((sym) => (
          <HeatCell key={sym} symbol={sym} pct={snapshots[sym]?.pct ?? null} />
        ))}
      </div>
    </div>
  );
}
