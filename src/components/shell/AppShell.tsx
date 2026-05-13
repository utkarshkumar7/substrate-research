import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import RightRail from "./RightRail";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}
