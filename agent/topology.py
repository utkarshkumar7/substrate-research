"""Loads topology.yaml into typed dataclasses."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
import yaml

YAML_PATH = Path(__file__).parent.parent / "topology.yaml"


@dataclass
class Layer:
    id: str
    name: str
    description: str
    order: int
    color: str
    parallel_to: Optional[str] = None


@dataclass
class Ticker:
    symbol: str
    name: str
    layer: str
    subcategory: str
    notes: Optional[str] = None
    is_etf: bool = False
    needs_verification: bool = False


@dataclass
class Edge:
    from_symbol: str
    to_symbol: str
    type: str
    note: Optional[str] = None


@dataclass
class MacroSignal:
    id: str
    affects: list[str]
    yfinance_proxy: str


@dataclass
class TopologyData:
    metadata: dict
    layers: list[Layer]
    tickers: list[Ticker]
    edges: list[Edge]
    macro_signals: list[MacroSignal]
    benchmark_etfs: list[str]

    def fetchable_symbols(self) -> list[str]:
        return [t.symbol for t in self.tickers if not t.needs_verification]

    def macro_proxy_symbols(self) -> list[str]:
        return [s.yfinance_proxy for s in self.macro_signals]

    def all_symbols_to_fetch(self) -> list[str]:
        return list(dict.fromkeys(
            self.fetchable_symbols()
            + self.macro_proxy_symbols()
            + self.benchmark_etfs
        ))


def load(path: Path = YAML_PATH) -> TopologyData:
    raw = yaml.safe_load(path.read_text())

    layers = [
        Layer(
            id=l["id"],
            name=l["name"],
            description=l["description"],
            order=l["order"],
            color=l["color"],
            parallel_to=l.get("parallel_to"),
        )
        for l in raw["layers"]
    ]

    tickers = [
        Ticker(
            symbol=t["symbol"],
            name=t["name"],
            layer=t["layer"],
            subcategory=t.get("subcategory", ""),
            notes=t.get("notes"),
            is_etf=t.get("is_etf", False),
            needs_verification=t.get("needs_verification", False),
        )
        for t in raw["tickers"]
    ]

    edges = [
        Edge(
            from_symbol=e["from"],
            to_symbol=e["to"],
            type=e["type"],
            note=e.get("note"),
        )
        for e in raw["edges"]
    ]

    macro_signals = [
        MacroSignal(
            id=m["id"],
            affects=m["affects"],
            yfinance_proxy=m["yfinance_proxy"],
        )
        for m in raw["macro_signals"]
    ]

    return TopologyData(
        metadata=raw["metadata"],
        layers=layers,
        tickers=tickers,
        edges=edges,
        macro_signals=macro_signals,
        benchmark_etfs=raw["benchmark_etfs"],
    )


if __name__ == "__main__":
    t = load()
    print(t)
