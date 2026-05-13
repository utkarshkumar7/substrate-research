# CLAUDE.md

Operating instructions for Claude Code working in this repo. Read this first every session.

## What this is

Personal AI-supply-chain research dashboard. Tracks ~50 equities across 8 layers (raw materials → energy → foundries → chip design → datacenter → applications, plus parallel storage and quantum). Hero view is a left-to-right pipeline graph. EOD data, medium/long-term horizon. Single user, local-first.

## Tech stack — locked, do not re-deliberate

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database:** Supabase (Postgres). Connected via MCP — use it to inspect schema and data instead of asking the user.
- **Data pipeline:** Python 3.12 + `uv`. Lives in `agent/`.
- **AI:** Anthropic SDK. `claude-sonnet-4-6` for reports, `claude-haiku-4-5-20251001` for routine work.
- **Charts:** Recharts. **Pipeline graph is hand-built SVG**, not react-flow or d3-force.
- **Icons:** Lucide React.
- **No shadcn/ui, no Material UI, no styled-components.** Tailwind primitives only.

## Source-of-truth files

- `BUILD_SPEC.md` — full phased build plan. Execute phases in order; respect acceptance criteria.
- `mockup.html` — visual ground truth. Open it before building any UI component. Replicate proportions, colors, font sizes.
- `topology.yaml` — the AI supply chain definition (layers, tickers, edges). When you need to know what supplies what, read this. Auto-generated to `src/lib/topology/topology.generated.ts` at build time via `scripts/gen-topology-ts.mjs`.
- `supabase/migrations/` — schema. Already applied to the live Supabase project.

## Architectural invariants — never violate

1. **The Python agent is the only writer to `tickers`, `prices`, `insights`, `refresh_log`.** Next.js never writes those tables. Next.js writes only to `holdings`, `conversations`, `messages`.
2. **`ANTHROPIC_API_KEY` is server-side only.** Never reference it in client components or `NEXT_PUBLIC_*` env vars. The only place it's used is `src/app/api/ask/route.ts` and the Python agent.
3. **`SUPABASE_SERVICE_ROLE_KEY` is server-side only.** Browser code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Server Components by default.** Use `"use client"` only for state, effects, or browser APIs.
5. **Topology imports come from `src/lib/topology`, never re-parse the YAML at runtime in the app.** The build script regenerates the TS file.

## Common commands

```bash
# Frontend
npm run dev                              # next dev (regenerates topology.ts first)
npm run build                            # next build
npx supabase gen types typescript ...    # regenerate database.types.ts (or use MCP)

# Python agent
cd agent
uv run python refresh.py -v --period 2y  # initial backfill
uv run python refresh.py --period 1mo    # daily incremental
uv run python insights.py                # anomaly detection + Claude narrative
```

## Design tokens (also in `tailwind.config.ts`)

- Surfaces: `bg #0a0b0e` · `bg-card #111217` · `bg-card-2 #16171c` · `bg-hover #1a1b21`
- Borders: `border #1f2127` · `border-strong #2a2c33`
- Text: `text #e8e9ec` · `text-secondary #9ca3af` · `text-muted #6b7280`
- Semantic: `up #4ade80` · `down #f87171` · `neutral #71717a`
- Accents: `accent #a78bfa` (purple, AI/brand) · `accent-2 #22d3ee` (cyan, hot flow only)
- Layers: raw `#b45309` · energy `#ea580c` · storage `#e11d48` · foundry `#2563eb` · chip `#4f46e5` · quantum `#7c3aed` · dc `#0d9488` · apps `#16a34a`

**Layer colors are accents only** (left bars, legend dots, subtle borders). Background stays neutral so performance green/red reads instantly. Cyan is reserved for "hot strand" highlighting in the pipeline graph; never use it for general UI.

## Numbers

- All numeric values (prices, percentages, volumes) use mono font (`font-mono`).
- Use a single `formatPercent()` / `formatCurrency()` helper from `src/lib/format.ts`. Don't inline number formatting.
- Heat buckets (used in heatmap and pipeline node colors): p3 ≥ +10% · p2 +5–10 · p1 +1–5 · z ±1 · n1 −1 to −5 · n2 −5 to −10 · n3 ≤ −10.

## Anti-patterns — do not do these

- Don't introduce libraries outside the locked stack without flagging it first.
- Don't fetch all 50 × 252 daily prices on page load. Query latest + N-days-ago in one round-trip via Supabase RPC or a single `select` with date filter.
- Don't add authentication for v1. Single user, local.
- Don't trust yfinance silently. Failures go to `refresh_log.failed_symbols`. The dashboard always shows a "last refresh" indicator.
- Don't write API routes for things Supabase client can do. The only API route is `/api/ask`.
- Don't put long-lived TODO comments in code. If a thing is deferred, add it to the "out of scope" section below.

## Out of scope for v1

Authentication, mobile responsive, real-time ticks, brokerage integration, options data, alerts (Slack/email/push), backtesting. Reasonable extensions but explicitly deferred.

## When to ask the user

- Before installing a library not in the locked stack.
- Before modifying `topology.yaml` (it's user-curated).
- Before changing the database schema (modify only via new migration files in `supabase/migrations/`).
- When a build phase's acceptance criteria are met — pause for verification before moving to the next phase.

Otherwise, proceed and summarize what you did when done.
