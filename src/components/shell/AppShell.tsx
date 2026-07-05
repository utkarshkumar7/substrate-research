import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import RightRail from "./RightRail";
import { createClient } from "@/lib/supabase/server";

async function latestDataDate(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("prices")
    .select("trade_date")
    .order("trade_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.trade_date ?? null;
}

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const dataDate = await latestDataDate();
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <TopBar dataDate={dataDate} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}
