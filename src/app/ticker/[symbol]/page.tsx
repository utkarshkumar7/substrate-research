export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return (
    <div className="p-6">
      <h1 className="font-semibold tracking-tight mb-2" style={{ fontSize: 22 }}>
        {symbol}
      </h1>
      <p className="text-text-muted" style={{ fontSize: 13 }}>
        Ticker detail — Phase 6
      </p>
    </div>
  );
}
