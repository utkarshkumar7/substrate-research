// AUTO-RUN via predev / prebuild. Parses pullback_watchlist.yaml → src/lib/pullback/watchlist.generated.ts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { load as loadYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const raw = loadYaml(readFileSync(join(root, "pullback_watchlist.yaml"), "utf8"));

const out = `// AUTO-GENERATED from pullback_watchlist.yaml — do not edit manually.

export interface WatchlistEntry {
  symbol: string;
  notes: string;
}

export const PULLBACK_WATCHLIST: WatchlistEntry[] = ${JSON.stringify(raw.watchlist, null, 2)};
`;

const outPath = join(root, "src", "lib", "pullback", "watchlist.generated.ts");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out, "utf8");
console.log("watchlist.generated.ts updated ✓");
