export const metadata = { title: "API Keys" }

export default function KeysPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-text font-semibold" style={{ fontSize: 18 }}>API Keys</h1>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
          Keys are set in{" "}
          <code className="font-mono text-accent" style={{ fontSize: 12 }}>.env.local</code>
          {" "}— never stored in the database.
        </p>
      </div>

      <div className="space-y-2">
        {[
          { label: "NEXT_PUBLIC_SUPABASE_URL", desc: "Supabase project URL" },
          { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Supabase anon key (browser-safe)" },
          { label: "SUPABASE_SERVICE_ROLE_KEY", desc: "Service role key — server-side only" },
          { label: "ANTHROPIC_API_KEY", desc: "Anthropic API key — server-side only" },
        ].map(({ label, desc }) => (
          <div key={label} className="rounded-lg border border-border bg-bg-card px-4 py-3 flex items-center gap-3">
            <code className="font-mono text-accent" style={{ fontSize: 12 }}>{label}</code>
            <span className="text-text-muted ml-auto text-right shrink-0" style={{ fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>

      <p className="text-text-muted mt-5" style={{ fontSize: 12 }}>
        See <code className="font-mono text-accent" style={{ fontSize: 11 }}>.env.local.example</code> at the repo root for the full template.
      </p>
    </div>
  )
}
