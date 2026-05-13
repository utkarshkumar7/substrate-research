/** RSI(14) using Wilder's smoothing, expects closes sorted ASC (oldest first). */
export function rsi14(closes: number[]): number | null {
  if (closes.length < 15) return null

  const changes = closes.slice(1).map((c, i) => c - closes[i])
  const first14 = changes.slice(0, 14)
  let avgGain = first14.filter((d) => d > 0).reduce((a, b) => a + b, 0) / 14
  let avgLoss = first14.filter((d) => d < 0).reduce((a, b) => a + Math.abs(b), 0) / 14

  for (const d of changes.slice(14)) {
    avgGain = (avgGain * 13 + Math.max(d, 0)) / 14
    avgLoss = (avgLoss * 13 + Math.max(-d, 0)) / 14
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** Beta of symbol vs benchmark, using daily returns over shared history. */
export function beta(
  symbolCloses: number[],
  benchCloses: number[]
): number | null {
  const len = Math.min(symbolCloses.length, benchCloses.length)
  if (len < 10) return null

  const sRets = symbolCloses.slice(0, len).slice(1).map((c, i) => c / symbolCloses[i] - 1)
  const bRets = benchCloses.slice(0, len).slice(1).map((c, i) => c / benchCloses[i] - 1)
  const n = sRets.length

  const bMean = bRets.reduce((a, b) => a + b, 0) / n
  const sMean = sRets.reduce((a, b) => a + b, 0) / n

  let cov = 0
  let varB = 0
  for (let i = 0; i < n; i++) {
    cov += (sRets[i] - sMean) * (bRets[i] - bMean)
    varB += (bRets[i] - bMean) ** 2
  }

  return varB === 0 ? null : cov / varB
}
