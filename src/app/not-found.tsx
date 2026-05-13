export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center" style={{ padding: 48 }}>
      <div className="font-mono text-text-muted mb-2" style={{ fontSize: 11 }}>404</div>
      <h1 className="font-semibold text-text mb-1" style={{ fontSize: 20 }}>Page not found</h1>
      <p className="text-text-muted" style={{ fontSize: 13 }}>
        <a href="/" className="text-accent hover:opacity-80 transition-opacity">← Back to home</a>
      </p>
    </div>
  )
}
