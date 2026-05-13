import { createClient } from "@/lib/supabase/server";
import { fetchableSymbols } from "@/lib/topology";
import { getHeatmapSnapshot } from "@/lib/queries/prices";
import HeatmapClient from "./HeatmapClient";

export default async function HeatmapGrid() {
  const client = createClient();
  const symbols = fetchableSymbols();
  const snapshots = await getHeatmapSnapshot(client, symbols);

  return <HeatmapClient snapshots={snapshots} />;
}
