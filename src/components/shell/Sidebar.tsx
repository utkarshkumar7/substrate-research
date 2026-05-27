"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GitBranch,
  LayoutGrid,
  Activity,
  AlertTriangle,
  Briefcase,
  Eye,
  BookOpen,
  Sun,
  CalendarDays,
  MessageSquare,
  Share2,
  KeyRound,
  TrendingDown,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Views",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Pipeline graph", href: "/pipeline", icon: GitBranch },
      { label: "Layer heatmap", href: "/heatmap", icon: LayoutGrid },
      { label: "Pullback radar", href: "/pullback", icon: TrendingDown },
      { label: "Correlations", href: "/correlations", icon: Activity },
      { label: "Anomalies", href: "/anomalies", icon: AlertTriangle, badge: 0 },
    ],
  },
  {
    label: "My stack",
    items: [
      { label: "Portfolio", href: "/portfolio", icon: Briefcase },
      { label: "Watchlist", href: "/watchlist", icon: Eye },
      { label: "Trade journal", href: "/journal", icon: BookOpen },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Daily report", href: "/insights", icon: Sun },
      { label: "Weekly review", href: "/weekly", icon: CalendarDays },
      { label: "Ask Claude", href: "/ask", icon: MessageSquare },
    ],
  },
  {
    label: "Config",
    items: [
      { label: "Topology", href: "/topology", icon: Share2 },
      { label: "API keys", href: "/keys", icon: KeyRound },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="bg-bg-card border-r border-border overflow-y-auto"
      style={{ width: 220, padding: "20px 12px" }}
    >
      {NAV.map((group) => (
        <div key={group.label} className="mb-6">
          <div
            className="text-text-muted uppercase px-3 pb-2"
            style={{ fontSize: 10, letterSpacing: "0.1em" }}
          >
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded mb-0.5 transition-colors",
                  isActive
                    ? "bg-bg-hover text-text font-medium"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text"
                )}
                style={{ fontSize: 13 }}
              >
                <Icon
                  className={clsx("shrink-0", isActive ? "text-accent" : "text-text-muted")}
                  style={{ width: 16, height: 16 }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="bg-bg text-text-muted rounded"
                    style={{ fontSize: 11, padding: "1px 6px" }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
