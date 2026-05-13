export type HeatBucket = "p3" | "p2" | "p1" | "z" | "n1" | "n2" | "n3";

export type Period = "1d" | "5d" | "1m" | "YTD";

export interface CloseRow {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface SymbolSnapshot {
  latest: number;
  latestDate: string;
  pct1d: number | null;
  pct5d: number | null;
  pct1m: number | null;
  pctYtd: number | null;
}

export function pctChange(latest: number, earlier: number): number {
  return ((latest - earlier) / earlier) * 100;
}

export function heatBucket(pct: number): HeatBucket {
  if (pct >= 10) return "p3";
  if (pct >= 5) return "p2";
  if (pct >= 1) return "p1";
  if (pct > -1) return "z";
  if (pct > -5) return "n1";
  if (pct > -10) return "n2";
  return "n3";
}

export function pctForPeriod(snap: SymbolSnapshot, period: Period): number | null {
  switch (period) {
    case "1d": return snap.pct1d;
    case "5d": return snap.pct5d;
    case "1m": return snap.pct1m;
    case "YTD": return snap.pctYtd;
  }
}

/** Build a SymbolSnapshot from a DESC-sorted array of closes. */
export function buildSnapshot(closes: CloseRow[]): SymbolSnapshot | null {
  if (!closes.length) return null;
  const latest = closes[0].close;
  const latestDate = closes[0].date;
  const currentYear = new Date().getFullYear();
  const ytdEntry = closes.find((c) => c.date < `${currentYear}-01-01`);

  return {
    latest,
    latestDate,
    pct1d: closes[1] != null ? pctChange(latest, closes[1].close) : null,
    pct5d: closes[5] != null ? pctChange(latest, closes[5].close) : null,
    pct1m: closes[21] != null ? pctChange(latest, closes[21].close) : null,
    pctYtd: ytdEntry != null ? pctChange(latest, ytdEntry.close) : null,
  };
}

/** Median % change across an array of nullable values. */
export function medianPct(values: (number | null)[]): number {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
