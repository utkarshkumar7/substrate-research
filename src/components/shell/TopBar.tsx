"use client";

import { Search, RefreshCw } from "lucide-react";

export default function TopBar() {
  return (
    <header
      className="flex items-center gap-0 px-6 bg-bg-card border-b border-border sticky top-0 z-50"
      style={{ height: "56px" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 font-semibold tracking-tight shrink-0">
        <div
          className="flex items-center justify-center font-bold text-bg rounded"
          style={{
            width: 24,
            height: 24,
            fontSize: 11,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
          }}
        >
          AI
        </div>
        <span style={{ fontSize: 14 }}>Command Center</span>
        <span className="text-text-muted font-normal" style={{ fontSize: 14 }}>
          / supply chain
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-[480px] mx-6 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          style={{ width: 14, height: 14 }}
        />
        <input
          type="text"
          placeholder="Search tickers, layers, or ask Claude…"
          className="w-full bg-bg border border-border rounded-md pl-9 pr-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 bg-bg border border-border rounded-full text-text-secondary"
          style={{ fontSize: 11 }}
        >
          <span className="inline-block rounded-full bg-up" style={{ width: 6, height: 6 }} />
          EOD data · {new Date().toISOString().slice(0, 10)}
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg border border-border rounded text-text hover:bg-bg-hover transition-colors"
          style={{ fontSize: 12 }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          Refresh
        </button>
      </div>
    </header>
  );
}
