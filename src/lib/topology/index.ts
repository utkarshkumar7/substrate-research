import { TOPOLOGY } from "./topology.generated";
import type { Layer, Ticker, Edge } from "./types";

export const topology = TOPOLOGY;

export function getLayer(id: string): Layer | undefined {
  return TOPOLOGY.layers.find((l) => l.id === id);
}

export function getTicker(symbol: string): Ticker | undefined {
  return TOPOLOGY.tickers.find((t) => t.symbol === symbol);
}

export function tickersByLayer(layerId: string): Ticker[] {
  return TOPOLOGY.tickers.filter((t) => t.layer === layerId);
}

export function upstreamOf(symbol: string): Edge[] {
  return TOPOLOGY.edges.filter((e) => e.to === symbol);
}

export function downstreamOf(symbol: string): Edge[] {
  return TOPOLOGY.edges.filter((e) => e.from === symbol);
}

export function fetchableSymbols(): string[] {
  return TOPOLOGY.tickers
    .filter((t) => !t.needsVerification)
    .map((t) => t.symbol);
}

export function layersInOrder(): Layer[] {
  return [...TOPOLOGY.layers].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}
