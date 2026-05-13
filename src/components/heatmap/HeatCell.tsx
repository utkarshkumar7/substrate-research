"use client";

import { useRouter } from "next/navigation";
import { heatBucket, type HeatBucket } from "@/lib/analytics/performance";
import { formatPercent } from "@/lib/format";

interface Props {
  symbol: string;
  pct: number | null;
}

const BUCKET_CLASS: Record<HeatBucket, string> = {
  p3: "heat-p3",
  p2: "heat-p2",
  p1: "heat-p1",
  z: "heat-z",
  n1: "heat-n1",
  n2: "heat-n2",
  n3: "heat-n3",
};

export default function HeatCell({ symbol, pct }: Props) {
  const router = useRouter();
  const bucket = pct != null ? heatBucket(pct) : "z";
  const cls = BUCKET_CLASS[bucket];

  return (
    <button
      onClick={() => router.push(`/ticker/${symbol}`)}
      className={`${cls} rounded cursor-pointer text-left font-mono font-medium`}
      style={{ fontSize: 10, padding: "6px 8px", minWidth: 56, textAlign: "center" }}
      title={symbol}
    >
      {symbol} {pct != null ? formatPercent(pct) : "—"}
    </button>
  );
}
