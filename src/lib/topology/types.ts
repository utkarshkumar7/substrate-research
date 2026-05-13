export interface Layer {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  parallelTo?: string;
}

export interface Ticker {
  symbol: string;
  name: string;
  layer: string;
  subcategory: string;
  notes?: string;
  isEtf?: boolean;
  needsVerification?: boolean;
}

export interface Edge {
  from: string;
  to: string;
  type: string;
  note?: string;
}

export interface MacroSignal {
  id: string;
  affects: string[];
  yfinanceProxy: string;
}

export interface Topology {
  metadata: { name: string; description: string; version: number; lastUpdated: string };
  layers: Layer[];
  tickers: Ticker[];
  edges: Edge[];
  macroSignals: MacroSignal[];
  benchmarkEtfs: string[];
}
