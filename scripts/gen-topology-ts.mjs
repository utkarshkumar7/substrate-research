// AUTO-RUN via predev / prebuild. Parses topology.yaml → src/lib/topology/topology.generated.ts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { load as loadYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const raw = loadYaml(readFileSync(join(root, "topology.yaml"), "utf8"));

function camel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelKeys(obj) {
  if (Array.isArray(obj)) return obj.map(camelKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [camel(k), camelKeys(v)])
    );
  }
  return obj;
}

const topology = camelKeys(raw);

const out = `// AUTO-GENERATED from topology.yaml — do not edit manually.
import type { Topology } from './types';

export const TOPOLOGY: Topology = ${JSON.stringify(topology, null, 2)};
`;

const outPath = join(root, "src", "lib", "topology", "topology.generated.ts");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out, "utf8");
console.log("topology.generated.ts updated ✓");
