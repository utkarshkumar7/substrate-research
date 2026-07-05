-- RPC: get_heatmap_snapshots
-- Computes 1d/5d/1m/YTD % changes server-side for a list of symbols.
-- Returns one row per symbol, avoiding the PostgREST 1000-row cap.

CREATE OR REPLACE FUNCTION public.get_heatmap_snapshots(p_symbols text[])
RETURNS TABLE (
  symbol text,
  latest_close float8,
  latest_date text,
  pct_1d float8,
  pct_5d float8,
  pct_1m float8,
  pct_ytd float8
)
LANGUAGE sql
STABLE
AS $$
  WITH ranked AS (
    SELECT
      p.symbol,
      p.trade_date::text,
      p.close,
      ROW_NUMBER() OVER (PARTITION BY p.symbol ORDER BY p.trade_date DESC) AS rn
    FROM prices p
    WHERE p.symbol = ANY(p_symbols)
      AND p.trade_date >= (date_trunc('year', CURRENT_DATE) - interval '1 year')::date
  ),
  pivoted AS (
    SELECT
      symbol,
      MAX(CASE WHEN rn = 1 THEN close END)      AS c0,
      MAX(CASE WHEN rn = 1 THEN trade_date END)  AS d0,
      MAX(CASE WHEN rn = 2 THEN close END)       AS c1,
      MAX(CASE WHEN rn = 6 THEN close END)       AS c5,
      MAX(CASE WHEN rn = 22 THEN close END)      AS c21
    FROM ranked
    GROUP BY symbol
  ),
  ytd AS (
    SELECT DISTINCT ON (p.symbol)
      p.symbol,
      p.close AS ytd_close
    FROM prices p
    WHERE p.symbol = ANY(p_symbols)
      AND p.trade_date < date_trunc('year', CURRENT_DATE)
    ORDER BY p.symbol, p.trade_date DESC
  )
  SELECT
    pv.symbol,
    pv.c0                                                              AS latest_close,
    pv.d0                                                              AS latest_date,
    CASE WHEN pv.c1  IS NOT NULL AND pv.c1  > 0 THEN (pv.c0 - pv.c1)  / pv.c1  * 100 END AS pct_1d,
    CASE WHEN pv.c5  IS NOT NULL AND pv.c5  > 0 THEN (pv.c0 - pv.c5)  / pv.c5  * 100 END AS pct_5d,
    CASE WHEN pv.c21 IS NOT NULL AND pv.c21 > 0 THEN (pv.c0 - pv.c21) / pv.c21 * 100 END AS pct_1m,
    CASE WHEN y.ytd_close IS NOT NULL AND y.ytd_close > 0
         THEN (pv.c0 - y.ytd_close) / y.ytd_close * 100 END          AS pct_ytd
  FROM pivoted pv
  LEFT JOIN ytd y ON pv.symbol = y.symbol
  WHERE pv.c0 IS NOT NULL
$$;
