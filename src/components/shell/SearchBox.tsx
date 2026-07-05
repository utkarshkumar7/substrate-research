"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Layers, MessageSquare } from "lucide-react";
import { topology, getLayer } from "@/lib/topology";

type Result =
  | { type: "ticker"; symbol: string; name: string; layerName: string; color: string }
  | { type: "layer"; id: string; name: string; color: string }
  | { type: "ask"; text: string };

const MAX_TICKERS = 6;
const MAX_LAYERS = 2;

function buildResults(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tickers = topology.tickers
    .filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
    .sort((a, b) => {
      // exact symbol, then symbol-prefix, then the rest
      const rank = (t: (typeof topology.tickers)[number]) =>
        t.symbol.toLowerCase() === q ? 0 : t.symbol.toLowerCase().startsWith(q) ? 1 : 2;
      return rank(a) - rank(b) || a.symbol.localeCompare(b.symbol);
    })
    .slice(0, MAX_TICKERS)
    .map((t): Result => {
      const layer = getLayer(t.layer);
      return {
        type: "ticker",
        symbol: t.symbol,
        name: t.name,
        layerName: layer?.name ?? t.layer,
        color: layer?.color ?? "#71717a",
      };
    });

  const layers = topology.layers
    .filter((l) => l.name.toLowerCase().includes(q))
    .slice(0, MAX_LAYERS)
    .map((l): Result => ({ type: "layer", id: l.id, name: l.name, color: l.color }));

  return [...tickers, ...layers, { type: "ask", text: query.trim() }];
}

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => buildResults(query), [query]);

  const go = (r: Result | undefined) => {
    if (!r) return;
    if (r.type === "ticker") router.push(`/ticker/${r.symbol}`);
    else if (r.type === "layer") router.push(`/heatmap?layer=${r.id}`);
    else router.push(`/ask?q=${encodeURIComponent(r.text)}`);
    setQuery("");
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) {
      if (e.key === "Enter" && query.trim()) go({ type: "ask", text: query.trim() });
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && results.length > 0;

  return (
    <div className="flex-1 max-w-[480px] mx-6 relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        style={{ width: 14, height: 14 }}
      />
      <input
        type="text"
        value={query}
        placeholder="Search tickers, layers, or ask Claude…"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="search-results"
        className="w-full bg-bg border border-border rounded-md pl-9 pr-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        style={{ fontSize: 13 }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
      />

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 bg-bg-card border border-border-strong rounded-lg overflow-hidden z-50"
          style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}
          onMouseDown={(e) => {
            // keep focus so the click registers before blur closes the list
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {results.map((r, i) => {
            const isActive = i === active;
            const key = r.type === "ask" ? "ask" : r.type === "layer" ? `l-${r.id}` : `t-${r.symbol}`;
            return (
              <div
                key={key}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className="flex items-center gap-2.5 cursor-pointer px-3"
                style={{ height: 40, background: isActive ? "var(--color-bg-hover)" : "transparent" }}
              >
                {r.type === "ticker" && (
                  <>
                    <span className="shrink-0 rounded-full" style={{ width: 7, height: 7, background: r.color }} />
                    <span className="font-mono font-semibold text-text" style={{ fontSize: 12, minWidth: 46 }}>
                      {r.symbol}
                    </span>
                    <span className="text-text-secondary truncate" style={{ fontSize: 12 }}>
                      {r.name}
                    </span>
                    <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 10 }}>
                      {r.layerName}
                    </span>
                  </>
                )}
                {r.type === "layer" && (
                  <>
                    <Layers className="shrink-0" style={{ width: 13, height: 13, color: r.color }} />
                    <span className="text-text" style={{ fontSize: 12 }}>{r.name}</span>
                    <span className="text-text-muted ml-auto shrink-0" style={{ fontSize: 10 }}>Layer · heatmap</span>
                  </>
                )}
                {r.type === "ask" && (
                  <>
                    <MessageSquare className="shrink-0 text-accent" style={{ width: 13, height: 13 }} />
                    <span className="text-text-secondary truncate" style={{ fontSize: 12 }}>
                      Ask Claude: <span className="text-text">“{r.text}”</span>
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
