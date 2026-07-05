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
        <svg
          className={`wafer-mark${spinning ? " is-refreshing" : ""}`}
          width={24}
          height={24}
          viewBox="0 0 48 48"
          fill="none"
          aria-label="Substrate"
        >
          <defs>
            <clipPath id="waferClip">
              <circle cx={24} cy={24} r={16.5} />
            </clipPath>
          </defs>
          {/* polished disc face */}
          <circle cx={24} cy={24} r={16.5} fill="var(--color-accent)" fillOpacity={0.1} />
          {/* die grid (the array of chips printed on the wafer) */}
          <g clipPath="url(#waferClip)" stroke="var(--color-accent)" strokeWidth={0.9} strokeOpacity={0.5}>
            <line x1={15} y1={6} x2={15} y2={42} />
            <line x1={21} y1={6} x2={21} y2={42} />
            <line x1={27} y1={6} x2={27} y2={42} />
            <line x1={33} y1={6} x2={33} y2={42} />
            <line x1={6} y1={15} x2={42} y2={15} />
            <line x1={6} y1={21} x2={42} y2={21} />
            <line x1={6} y1={27} x2={42} y2={27} />
            <line x1={6} y1={33} x2={42} y2={33} />
          </g>
          {/* the flagship die at center */}
          <rect x={21} y={21} width={6} height={6} fill="var(--color-accent)" clipPath="url(#waferClip)" />
          {/* wafer edge */}
          <circle cx={24} cy={24} r={16.5} stroke="var(--color-accent)" strokeWidth={2.2} />
          {/* orientation notch carved into the edge */}
          <path d="M21.5 41 L26.5 41 L24 35.5 Z" fill="var(--color-bg-card)" />
        </svg>
        <span style={{ fontSize: 14 }}>Substrate</span>
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
