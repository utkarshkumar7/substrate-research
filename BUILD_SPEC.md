# AI Supply Chain Command Center — Build Spec

This document is the complete specification for building the dashboard. It is written to be handed directly to Claude Code as the source of truth. Decisions already made are not up for re-litigation — execute them.

**Inputs in this folder:**
- `BUILD_SPEC.md` — this file
- `mockup.html` — the visual design reference (open in browser)
- `topology.yaml` — the AI supply chain definition (layers, tickers, edges)
- `001_initial_schema.sql` — Supabase migration

---

## 0. What we're building

A personal AI-supply-chain research dashboard. Tracks ~50 equities organized into 8 layers (raw materials → energy → foundries → chip design → datacenter → applications, plus parallel storage and quantum lanes). Surfaces a **pipeline graph** (the hero view), a **layer heatmap**, and an **Ask Claude** interface grounded in the topology. EOD data via yfinance; Claude API for narrative insights and anomaly detection. Local-first, single-user.

This is *equity research*, not real-time trading. Medium/long-term horizon.

---

## 1. Tech stack — locked

| Layer | Choice |
|---|---|
| Frontend | **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS** |
| Database | **Supabase** (Postgres, free tier) |
| Data pipeline | **Python 3.12+** with `uv` for env management |
| Market data | `yfinance` (free, EOD) |
| AI | Anthropic Python + JS SDKs. `claude-sonnet-4-6` for reports, `claude-haiku-4-5-20251001` for routine work |
| Charts | **Recharts** for price/line charts |
| Pipeline graph | **Hand-built SVG** with React (do not use react-flow or d3-force — the layout is fixed left-to-right and a network graph library adds complexity for no benefit here) |
| Icons | **Lucide React** |
| Deployment | Local for v1. Vercel-ready architecture so it can deploy later. |

**Do not introduce other libraries without a strong reason.** Specifically: no shadcn/ui (the design is custom), no react-flow, no Material UI, no styled-components.

---

## 2. Architecture

```
                ┌──────────────────────────────┐
                │  topology.yaml (repo root)   │
                │  ~50 tickers · 8 layers ·    │
                │  ~70 supply edges            │
                └──────────────┬───────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   ┌─────────────────────┐         ┌────────────────────────┐
   │  Python agent (cron) │         │  Next.js dashboard     │
   │  agent/refresh.py    │         │  (this is the app)     │
   │  agent/insights.py   │         │                        │
   └──────────┬──────────┘         └──────────┬─────────────┘
              │                                │
              │   writes                       │   reads (SSR + client)
              │                                │
              ▼                                ▼
        ┌─────────────────────────────────────────────┐
        │            Supabase (Postgres)              │
        │  tickers · prices · holdings · insights ·   │
        │  refresh_log · conversations · messages     │
        └─────────────────────────────────────────────┘
```

The Python agent is **the only writer** to the database. The Next.js app is **read-only** to prices/insights/refresh_log; it writes to `holdings`, `conversations`, and `messages` via Supabase client. The `/api/ask` route is the only place that talks to Anthropic from the frontend (server-side, never browser).

---

## 3. Repo structure

```
ai-command-center/
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── README.md
├── .env.local.example
├── .gitignore
│
├── topology.yaml                    # SOURCE OF TRUTH
├── mockup.html                      # design reference
│
├── scripts/
│   ├── gen-topology-ts.mjs          # YAML → TypeScript at build time
│   └── gen-supabase-types.sh        # generates database.types.ts
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # already written
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home: pipeline overview (hero)
│   │   ├── globals.css
│   │   ├── heatmap/page.tsx
│   │   ├── pipeline/page.tsx
│   │   ├── ticker/[symbol]/page.tsx
│   │   ├── ask/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── insights/page.tsx
│   │   └── api/
│   │       └── ask/route.ts         # server-side Claude proxy (streaming)
│   │
│   ├── components/
│   │   ├── shell/
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── RightRail.tsx
│   │   │   └── AppShell.tsx         # layout grid
│   │   ├── pipeline/
│   │   │   ├── PipelineGraph.tsx    # the SVG hero
│   │   │   ├── PipelineNode.tsx
│   │   │   └── PipelineEdge.tsx
│   │   ├── heatmap/
│   │   │   ├── HeatmapGrid.tsx
│   │   │   ├── HeatRow.tsx
│   │   │   └── HeatCell.tsx
│   │   ├── ticker/
│   │   │   ├── PriceChart.tsx
│   │   │   ├── UpstreamDownstream.tsx
│   │   │   ├── TickerStats.tsx
│   │   │   └── ClaudeTake.tsx
│   │   ├── ask/
│   │   │   ├── ChatThread.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── insights/
│   │   │   ├── InsightCard.tsx
│   │   │   └── InsightList.tsx
│   │   ├── portfolio/
│   │   │   ├── HoldingsList.tsx
│   │   │   ├── LayerAllocation.tsx
│   │   │   └── HoldingForm.tsx
│   │   └── ui/
│   │       ├── MetricCard.tsx
│   │       ├── Chip.tsx
│   │       ├── Pill.tsx
│   │       └── Sparkline.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # browser client
│   │   │   ├── server.ts            # server client (RSC)
│   │   │   └── database.types.ts    # generated
│   │   ├── topology/
│   │   │   ├── index.ts             # exports helpers
│   │   │   ├── topology.generated.ts  # auto-generated from yaml
│   │   │   └── types.ts             # Layer, Ticker, Edge
│   │   ├── claude/
│   │   │   └── client.ts            # Anthropic SDK wrapper
│   │   ├── queries/                 # typed Supabase query helpers
│   │   │   ├── prices.ts
│   │   │   ├── holdings.ts
│   │   │   └── insights.ts
│   │   ├── analytics/
│   │   │   ├── performance.ts       # 1d/5d/1m/YTD % change calcs
│   │   │   ├── correlations.ts      # rolling correlations, z-scores
│   │   │   └── layer-health.ts      # aggregate per-layer scores
│   │   └── design/
│   │       └── tokens.ts            # exports the color tokens for SVG use
│   │
│   └── styles/
│       └── globals.css
│
└── agent/                           # Python data pipeline
    ├── pyproject.toml               # uv-managed
    ├── .env.example
    ├── README.md
    ├── topology.py                  # loads ../topology.yaml
    ├── fetcher.py                   # yfinance wrapper
    ├── store.py                     # Supabase Python client wrapper
    ├── refresh.py                   # CLI: pull prices → Supabase
    ├── insights.py                  # CLI: anomaly detection + Claude summary
    ├── analytics.py                 # correlation breaks, layer divergence
    └── scheduler/
        └── crontab.example
```

---

## 4. Database — already specified

Use `supabase/migrations/001_initial_schema.sql` as-is. Run it once in Supabase Studio (Dashboard → SQL Editor). Tables: `tickers`, `prices`, `holdings`, `insights`, `refresh_log`, `conversations`, `messages`. RLS is disabled (single-user app).

Generate TypeScript types with `npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts`. Include this in `scripts/gen-supabase-types.sh`.

---

## 5. Topology

The `topology.yaml` at the repo root is the source of truth. It contains:
- 8 **layers** with `id`, `name`, `description`, `order`, `color`, optional `parallel_to`
- ~50 **tickers** with `symbol`, `name`, `layer`, `subcategory`, optional `notes`, `is_etf`, `needs_verification`
- ~70 **edges** with `from`, `to`, `type`, optional `note` — these encode real supply chain relationships
- **macro_signals** (commodity ETF proxies for each layer)
- **benchmark_etfs** (SPY, SOXX, URA, REMX, etc.)

### Build script: `scripts/gen-topology-ts.mjs`

At build time (and `npm run dev` startup), parse `topology.yaml` and emit `src/lib/topology/topology.generated.ts`:

```typescript
// AUTO-GENERATED from topology.yaml — do not edit manually.
import type { Topology } from './types';

export const TOPOLOGY: Topology = {
  metadata: { /* ... */ },
  layers: [ /* ... */ ],
  tickers: [ /* ... */ ],
  edges: [ /* ... */ ],
  macroSignals: [ /* ... */ ],
  benchmarkEtfs: [ /* ... */ ],
};
```

Add to `package.json`: `"prebuild": "node scripts/gen-topology-ts.mjs"` and `"predev": "node scripts/gen-topology-ts.mjs"`.

### `src/lib/topology/types.ts`

```typescript
export interface Layer {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  parallelTo?: string;
}

export interface Ticker {
  symbol: string;
  name: string;
  layer: string;
  subcategory: string;
  notes?: string;
  isEtf?: boolean;
  needsVerification?: boolean;
}

export interface Edge {
  from: string;
  to: string;
  type: string;
  note?: string;
}

export interface MacroSignal {
  id: string;
  affects: string[];
  yfinanceProxy: string;
}

export interface Topology {
  metadata: { name: string; description: string; version: number; lastUpdated: string };
  layers: Layer[];
  tickers: Ticker[];
  edges: Edge[];
  macroSignals: MacroSignal[];
  benchmarkEtfs: string[];
}
```

### `src/lib/topology/index.ts` — helpers

```typescript
import { TOPOLOGY } from './topology.generated';

export const topology = TOPOLOGY;

export function getLayer(id: string) { /* ... */ }
export function getTicker(symbol: string) { /* ... */ }
export function tickersByLayer(layerId: string): Ticker[] { /* ... */ }
export function upstreamOf(symbol: string): Edge[] { /* ... */ }
export function downstreamOf(symbol: string): Edge[] { /* ... */ }
export function fetchableSymbols(): string[] { /* excludes needs_verification */ }
export function layersInOrder(): Layer[] { /* sorted by .order then .id */ }
```

---

## 6. Design system

Match `mockup.html` exactly. The mockup IS the design spec. When in doubt, open it and replicate.

### Color tokens — `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg:           "#0a0b0e",
        "bg-card":    "#111217",
        "bg-card-2":  "#16171c",
        "bg-hover":   "#1a1b21",
        // Borders
        border:           "#1f2127",
        "border-strong":  "#2a2c33",
        // Text
        text:             "#e8e9ec",
        "text-secondary": "#9ca3af",
        "text-muted":     "#6b7280",
        // Semantic
        up:      "#4ade80",
        down:    "#f87171",
        neutral: "#71717a",
        // Accents
        accent:   "#a78bfa",  // purple
        "accent-2": "#22d3ee",  // cyan
        // Layer accent colors (also exported from src/lib/design/tokens.ts for SVG use)
        layer: {
          raw:      "#b45309",
          energy:   "#ea580c",
          storage:  "#e11d48",
          foundry:  "#2563eb",
          chip:     "#4f46e5",
          quantum:  "#7c3aed",
          dc:       "#0d9488",
          apps:     "#16a34a",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: { sm: "4px", DEFAULT: "6px", md: "8px", lg: "10px", xl: "12px" },
      fontSize: {
        xs: ["11px", "1.4"],
        sm: ["12px", "1.5"],
        base: ["13px", "1.5"],
        md: ["14px", "1.5"],
        lg: ["16px", "1.4"],
        xl: ["18px", "1.3"],
        "2xl": ["22px", "1.2"],
        "3xl": ["28px", "1.2"],
      },
    },
  },
} satisfies Config;
```

### Typography & sizing

- Body: 13px, leading 1.5
- Headings: weight 600, letter-spacing -0.01em
- Mono font for: all numeric values (prices, percentages, volumes, IDs)
- Section titles: 14px / weight 600
- Section subtitles: 12px / muted

### Layout

The shell is a three-column grid: **sidebar (220px) | main (flex) | right rail (320px)**. The top bar is 56px tall, sticky. See `mockup.html` for exact spacing — pages have 24px padding, sections have 16px gap.

### Color philosophy

- Layer colors are used **only on left edges** of node cards, **dots** in legends, and **subtle accent** in node borders. Do not flood the UI with layer color; the background stays neutral so performance (green/red) reads instantly.
- Performance colors are universal: green = up, red = down, gray = flat (±0.5%).
- Cyan (`accent-2`) is reserved for "hot flow" highlighting — never apply to general UI.
- Purple (`accent`) is reserved for AI-generated content (Claude model tags, brand mark, "Ask Claude" affordances).

---

## 7. Build phases — execute in order

Each phase has a deliverable and acceptance criteria. **Do not move to phase N+1 until phase N's acceptance criteria are met.**

### Phase 0 — Scaffolding (target: 1 sitting)

1. `npx create-next-app@latest ai-command-center --typescript --tailwind --eslint --app --src-dir --no-import-alias`
2. Install deps: `npm i @supabase/supabase-js @supabase/ssr js-yaml @anthropic-ai/sdk recharts lucide-react clsx tailwind-merge date-fns`
3. Dev deps: `npm i -D @types/js-yaml`
4. Configure `tailwind.config.ts` with the design tokens from §6
5. Configure `next.config.mjs` (basic, server actions enabled)
6. Set up Supabase: create project, copy URL + anon key + service role key into `.env.local`
7. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
8. Generate types: `npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/database.types.ts`
9. Write `scripts/gen-topology-ts.mjs` — parses YAML, emits typed TS
10. Wire prebuild/predev hooks in `package.json`
11. Set up `agent/` Python project with `uv init`; install `pyyaml`, `yfinance`, `supabase`, `anthropic`, `python-dotenv`, `pandas`

**Acceptance:**
- `npm run dev` shows the Next.js default page
- `npm run dev` regenerates `topology.generated.ts` automatically on save
- Supabase Studio shows the 7 tables
- `cd agent && uv run python -c "from topology import load; print(load())"` prints the loaded topology

### Phase 1 — Python agent + initial data load (target: 1 sitting)

The agent is **the only writer**. Port the SQLite-era logic to Supabase.

`agent/topology.py` — load `../topology.yaml` into typed dataclasses (mirror the structure in §5).

`agent/fetcher.py` — wrap yfinance with retry. Same as the SQLite version: 3 attempts with backoff, sequential with 0.4s sleep between symbols. Return list of `PriceRow`-equivalent dicts.

`agent/store.py` — Supabase client wrapper. Use the service-role key (server-side). Operations needed:
- `upsert_ticker(symbol, name, layer, subcategory, notes, is_etf, needs_verification)` — upsert into `tickers`
- `insert_prices(rows: list[dict])` — bulk upsert into `prices` (on conflict do update, since EOD prices can be revised)
- `mark_synced(symbol, error)` — update `last_synced_at` and `last_error`
- `log_refresh(success, n_tickers, n_failed, duration_s, failed_symbols)` — insert into `refresh_log`

`agent/refresh.py` — CLI entry. Reads topology, registers all tickers, fetches each + macro proxies + benchmark ETFs, writes to Supabase, logs the run. Flags: `--period {2y,6mo,1mo,5d}` (default `2y` for first run, `1mo` for daily), `--symbols S1 S2` (override), `-v`.

`agent/scheduler/crontab.example`:
```cron
# Pull EOD prices on weekdays after market close (Central Time)
0 17 * * 1-5 cd /path/to/ai-command-center/agent && uv run python refresh.py --period 1mo
# Run insights pipeline after the price pull
30 17 * * 1-5 cd /path/to/ai-command-center/agent && uv run python insights.py
```

**Acceptance:**
- `cd agent && uv run python refresh.py -v --period 2y` finishes within 2-3 minutes
- Supabase Studio shows ~50 rows in `tickers`, ~25k rows in `prices`, 1 row in `refresh_log`
- The 4 `needs_verification: true` tickers are skipped (XE, P, FLY, AVEX)

### Phase 2 — App shell (target: half a day)

Build the layout grid that wraps every page. No real data yet; placeholder content.

`src/components/shell/AppShell.tsx` — wraps children:
```
┌──────────────────────────────────────────┐
│              TopBar (56px)               │
├────────┬───────────────────────┬─────────┤
│        │                       │         │
│Sidebar │      {children}       │RightRail│
│ 220px  │      flex             │  320px  │
│        │                       │         │
└────────┴───────────────────────┴─────────┘
```

`TopBar` — brand (gradient square + "Command Center"), search input, live-data pill, refresh button. See mockup.html lines for the topbar.

`Sidebar` — nav groups: Views (Home/Pipeline/Heatmap/Correlations/Anomalies), My Stack (Portfolio/Watchlist/Journal), Intelligence (Daily/Weekly/Ask), Config (Topology/Keys). Use Lucide icons; not Unicode glyphs like the mockup. Active state from `usePathname()`.

`RightRail` — empty for now; phase 5 fills it.

**Acceptance:**
- Visit `/` and see the three-column shell rendered with placeholder text in each region
- Sidebar nav items highlight on hover and active
- Layout doesn't shift between routes

### Phase 3 — Heatmap (target: 1 sitting) ★ first real view

Build `/heatmap` first. It's the fastest win: validates Supabase queries, the topology import, the design tokens, and the heat-color logic — all of which the pipeline graph also needs.

`src/lib/analytics/performance.ts`:
```typescript
// Given a wide table of closes [{date, NVDA: 950, AMD: 120, ...}], compute % change
export function pctChange(latest: number, earlier: number): number;
export function asOfNDaysAgo(closes: PriceSeries, n: number): number | null;
// Given an array of % changes, return a heat bucket: 'p3'|'p2'|'p1'|'z'|'n1'|'n2'|'n3'
export function heatBucket(pct: number): HeatBucket;
```

Heat scale (matches the mockup):
- p3: ≥ +10%
- p2: +5 to +10
- p1: +1 to +5
- z: -1 to +1
- n1: -1 to -5
- n2: -5 to -10
- n3: ≤ -10

`src/lib/queries/prices.ts`:
```typescript
// Returns latest close and N-day-ago close for every symbol, in one query
export async function getRecentCloses(client, daysBack: number = 30): Promise<Record<string, { latest: number; latestDate: string; prior: number }>>;
```

`src/components/heatmap/HeatmapGrid.tsx` — server component. Reads topology, fetches recent closes from Supabase, computes per-symbol % change for the active period (1d/5d/1m/YTD via chip selector), groups by layer, renders rows sorted by layer momentum (hottest layer first).

`src/components/heatmap/HeatCell.tsx` — pill with symbol + % change. Background color from heat bucket. Click → `/ticker/[symbol]`.

`/heatmap/page.tsx` — uses Server Component for initial render with default period; client component handles period switching (chips).

**Acceptance:**
- Visiting `/heatmap` with real data shows all 8 layer rows, every fetchable ticker as a cell, color-coded by 5d performance by default
- Switching period chips updates the grid (client-side, no full page reload)
- Visual match to mockup screen 1 heatmap section (proportions, colors, font sizes)

### Phase 4 — Pipeline graph (target: 2 sittings) ★ the hero

This is the killer view and the most custom code. The mockup pipeline SVG is 1180×540 viewBox — translate that to React.

`src/components/pipeline/PipelineGraph.tsx`:

**Layout strategy.** Compute node positions deterministically from the topology:
- Each layer has an `order` (0-5). x-position = `60 + order * 220`.
- Layers with the same `order` (parallel: energy+storage, chip+quantum) split the column vertically.
- Within a layer, sort tickers by symbol (stable). y-position = `60 + index * 40`.
- Node dimensions: 100 × 36px. Layer color as 4px left bar.

**Edge rendering.** Bezier curves between node midpoints. Default stroke `#9ca3af`, opacity 0.45. Edges where both endpoints are in today's top-decile performers get the `accent-2` (#22d3ee) treatment with opacity 0.7 — that's the "hot strand."

**Coloring.** Each node displays symbol + name truncated + today's % change in green/red/gray. Use the same heat colors as the heatmap (but applied to text only, not background — background stays `#16171c`).

**Interactivity.**
- Click a node → navigate to `/ticker/[symbol]`
- Hover a node → highlight the node, dim other nodes, emphasize upstream and downstream edges (filter by edge.from === symbol OR edge.to === symbol)
- The right rail updates to show the hovered ticker's mini stats

Use `viewBox` + responsive width. Don't fix pixel dimensions on the outer SVG.

`src/app/page.tsx` (home) becomes screen 1: top metric cards row + PipelineGraph + heatmap teaser + right rail content. Match `mockup.html` Screen 1 exactly.

**Acceptance:**
- Home page renders pipeline with all ~46 fetchable tickers in correct layer columns
- Edges are visible and connect the right node pairs (verify a few by hand: TSM→NVDA, NVDA→CRWV, MP→TSLA)
- Hover dims and highlights work smoothly
- Click navigates to ticker page
- Visually matches `mockup.html` Screen 1

### Phase 5 — Right rail (insights + holdings + layer health) (target: half a day)

`RightRail` becomes a real component sourced from Supabase + topology computations:
- **Today's intelligence:** last 4 entries from `insights` table, ordered by created_at desc
- **Layer health:** computed live in a Server Component — for each layer, mean 5d % change of its tickers, sorted descending, displayed as bar + score
- **Holdings:** rows from `holdings` table joined to latest prices, sorted by current value descending

The insights table will be empty until phase 7 — show a "no insights yet" placeholder.

`src/components/insights/InsightCard.tsx` — tag pill (FLOW/SIGNAL/ANOMALY/CONTEXT) + bold title + body + footer (timestamp, model). Match mockup styling exactly.

**Acceptance:**
- Right rail shows layer health bars matching today's data
- Holdings list shows whatever's in the `holdings` table (insert test rows via Supabase Studio)
- Insight cards render in correct order with correct tag colors

### Phase 6 — Ticker detail page (target: 1 sitting)

`/ticker/[symbol]/page.tsx` — match `mockup.html` Screen 2.

- Header: large symbol + name + current price + day change
- Price chart: Recharts `<LineChart>` with NVDA's close and SOXX (or relevant benchmark from topology.benchmark_etfs) overlaid as dashed line. Period selector chips (1M / 6M / 1Y / 5Y).
- Upstream / downstream panel: read `topology.upstreamOf(symbol)` and `topology.downstreamOf(symbol)`, join to latest prices, render two columns with layer-colored dots.
- Stats card: market cap, P/E, 52w range, 1d/5d/1m %, RSI(14), beta vs SPY. RSI and beta computed client-side from the price history (write helpers in `lib/analytics/`).
- Claude's take card: server-side call to `/api/ask` with a prefilled prompt: "Give a brief read on {symbol} based on today's move, its upstream/downstream supply chain context, and recent layer dynamics. Max 100 words. Disclaimer footer."

Cache Claude takes for 1 hour to avoid burning tokens on every page view.

**Acceptance:**
- Clicking any node in the pipeline opens its detail page
- Price chart renders with correct period
- Upstream/downstream sections show real supply chain context from topology
- Claude's take generates on first load, caches for subsequent loads

### Phase 7 — Insights pipeline (target: 1 sitting)

The Python agent generates insights daily.

`agent/analytics.py`:
- `detect_correlation_breaks(window_long=90, window_short=5, threshold=2.0)` — find pairs whose rolling correlation has changed by > threshold sigma. Return tuples (sym1, sym2, baseline_corr, current_corr, z_score).
- `detect_layer_divergence()` — flag when one layer's median 5d return is >2σ above/below the basket median.
- `detect_volume_spikes(threshold=3.0)` — single-symbol volume z-score > 3.

`agent/insights.py` — CLI that:
1. Runs the analytics detectors
2. For each detection, calls Claude (Haiku for routine, Sonnet for the daily summary) to write a 1-2 sentence narrative
3. Writes rows to `insights` table with appropriate `kind` (anomaly/flow/signal/context)
4. Generates a daily summary insight (`kind='daily'`) that integrates everything

Claude system prompt for insights includes: topology layer names, today's layer health scores, all detection outputs. Use prompt caching on the topology context (it's stable across calls).

**Acceptance:**
- Running `uv run python insights.py` writes new rows to `insights`
- The right rail picks them up automatically on next refresh
- Token spend per run is < $0.10 (mostly Haiku, one Sonnet call for the daily summary)

### Phase 8 — Ask Claude (target: 1.5 sittings) ★ killer feature

The `/ask` page is conversational interaction grounded in the topology and latest data.

`src/app/api/ask/route.ts` — POST endpoint that:
1. Receives `{ conversation_id, user_message, holdings? }`
2. Builds a system prompt with:
   - Today's date and a one-line description of the app
   - Compressed topology (layer names + tickers per layer, no full edges — too long)
   - Today's snapshot: layer health scores, top 5 movers, recent insights
   - User's current holdings if available
3. Pulls prior messages from `messages` table for context
4. Calls `claude-sonnet-4-6` with streaming
5. Streams response back to client; persists the assistant message to `messages` on completion

Use prompt caching on the topology + snapshot block (changes once per day) and Anthropic's streaming API. Use the Vercel AI SDK (`@ai-sdk/anthropic`) if it simplifies the streaming code — otherwise raw fetch + SSE is fine.

`src/components/ask/ChatThread.tsx` — message list with role-aware bubbles. The assistant bubble has a small purple-cyan gradient bullet (matches the brand mark) and a "used your topology, latest prices, and 1y correlation data" subtitle.

`src/components/ask/ChatInput.tsx` — textarea + send button + suggested follow-up chips (cleared on first send).

**Acceptance:**
- Asking "what's hot today?" returns a response that names actual tickers in your topology with today's actual numbers
- Asking "restructure my portfolio" produces a response like Screen 3 in the mockup — multiple candidate allocations referencing real layers and real tickers
- Conversations persist across page reloads
- Streaming works (no waiting for the full response before rendering starts)

### Phase 9 — Portfolio (target: half a day)

`/portfolio/page.tsx`:
- Holdings table (HoldingForm to add/edit rows)
- Layer allocation donut: % of portfolio value in each layer (Recharts `<PieChart>` with `innerRadius`)
- Total value, total cost basis, total P&L, P&L %
- "Restructure" button that prefills `/ask` with the holdings as context

`HoldingForm` — symbol autocomplete from topology, shares input, cost basis (optional).

**Acceptance:**
- Can add/edit/delete holdings
- Donut shows correct layer allocation
- Numbers reconcile to the sum of (shares × latest close)

---

## 8. What NOT to do (anti-patterns)

- **Don't put the Anthropic API key in browser code.** Only the `/api/ask` route reads it server-side. The browser never sees `ANTHROPIC_API_KEY`.
- **Don't add authentication for v1.** Single user, single laptop. Add later if you deploy to Vercel.
- **Don't use react-flow or d3-force for the pipeline.** The layout is fixed left-to-right with deterministic positions — handcrafted SVG is simpler and renders faster.
- **Don't fetch all 50 × 252 daily prices on every page load.** Use Supabase RPC functions or a materialized view for "latest snapshot" queries. Phase 3 will guide the right pattern — get one server-side query that returns latest + N-days-ago for every symbol, then compute deltas in TypeScript.
- **Don't introduce shadcn/ui or any component library.** Tailwind primitives only. The design is custom; libraries fight it.
- **Don't trust yfinance silently.** If a fetch fails or returns empty, log to `refresh_log.failed_symbols`. The dashboard should always show a "last refresh: X ago, N tickers failed" indicator so you know when data is stale.
- **Don't write API routes for things Supabase client can do directly.** Reading prices, holdings, insights, refresh_log all go through the Supabase JS client (server or browser, depending on context). The only API route should be `/api/ask`.
- **Don't reformat numbers in JSX.** Use a single `formatPercent()` / `formatCurrency()` helper from `lib/format.ts`. Consistency matters more than micro-optimizations.

---

## 9. Environment variables

`.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-side only; never NEXT_PUBLIC

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...        # server-side only
```

`agent/.env`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 10. README content for the finished repo

Include in `README.md`:
- One-paragraph project description
- Architecture diagram (the ASCII one from §2 is fine)
- Setup steps:
  1. Create Supabase project + paste API keys into `.env.local`
  2. Run the migration
  3. `npm install && npm run dev`
  4. `cd agent && uv sync && uv run python refresh.py -v --period 2y` for initial load
  5. Schedule the daily refresh via cron
- How to edit the topology (point to `topology.yaml`)
- API cost note (~$5–10/month based on phase 7 + phase 8 usage estimates)
- Disclaimer (not financial advice)

---

## 11. Execution notes for Claude Code

- **Read `mockup.html` first**, then this spec, then `topology.yaml`. The mockup is the visual ground truth.
- Execute phases in order. After each phase, summarize what was built and verify acceptance criteria before continuing.
- When ambiguity arises, **prefer the simpler choice that matches the mockup**. Don't add features not specified.
- When picking between libraries within the locked stack (e.g. how to do streaming for `/api/ask`), pick the one with the smaller surface area and shorter docs.
- Use server components by default. Only use `"use client"` when you need state, effects, or browser APIs.
- Format on save (Prettier). 2-space indent.

---

## Out of scope for v1 (do not build)

- Authentication / multi-user
- Mobile-responsive design (desktop-first for now; mobile is a phase 10 concern)
- Real-time price ticks (EOD only)
- Brokerage integration (no Plaid in v1)
- Options or derivatives data
- Alerts (Slack/email/push notifications)
- Backtesting engine

These are all reasonable extensions but explicitly deferred.
