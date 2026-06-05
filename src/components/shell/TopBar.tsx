"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw } from "lucide-react";

type RefreshState = "idle" | "pulling" | "done" | "error"

export default function TopBar() {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleRefresh = async () => {
    if (state === "pulling") return;
    setState("pulling");
    setStatusMsg("Pulling prices…");

    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        const dur = data.duration_s ? `${Math.round(data.duration_s)}s` : "";
        const failed = data.n_failed > 0 ? ` · ${data.n_failed} failed` : "";
        setStatusMsg(`${data.n_succeeded ?? "?"} tickers ${dur}${failed}`);
        setState("done");
        router.refresh();
      } else {
        setStatusMsg("Refresh failed");
        setState("error");
      }
    } catch {
      setStatusMsg("Refresh failed");
      setState("error");
    }

    // Reset after 4s
    setTimeout(() => {
      setState("idle");
      setStatusMsg("");
    }, 4000);
  };

  const spinning = state === "pulling";
  const btnBg = state === "done" ? "#16171c" : state === "error" ? "#16171c" : "#16171c";
  const btnColor = state === "done" ? "#4ade80" : state === "error" ? "#f87171" : "#e8e9ec";

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
          onClick={handleRefresh}
          disabled={spinning}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded transition-colors hover:bg-bg-hover"
          style={{
            fontSize: 12,
            background: btnBg,
            color: btnColor,
            cursor: spinning ? "not-allowed" : "pointer",
            minWidth: 120,
          }}
        >
          <RefreshCw
            style={{
              width: 12, height: 12, flexShrink: 0,
              animation: spinning ? "spin 0.8s linear infinite" : "none",
            }}
          />
          <span className="truncate">
            {state === "idle" ? "Refresh prices" : statusMsg}
          </span>
        </button>
      </div>
    </header>
  );
}
