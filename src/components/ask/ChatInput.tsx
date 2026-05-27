import { useRef, useEffect } from "react"

const OPTION_TEMPLATE = `Should I buy <TICKER> <EXP_DATE> $<STRIKE> CALL at $<PRICE>?
Robinhood quotes: bid $X, ask $Y, IV Z%, volume V, OI N.`

const SIGNAL_TEMPLATE = `Signal from <source>:

<paste tweet/content here>`

interface Chip {
  label: string
  prefill?: string
  send?: string
}

const CHIPS: Chip[] = [
  { label: "Analyze an option I'm considering", prefill: OPTION_TEMPLATE },
  { label: "Review a signal/tweet", prefill: SIGNAL_TEMPLATE },
  { label: "What's hot today?", send: "What's hot today?" },
  { label: "Restructure my holdings", send: "Restructure my holdings" },
]

interface Props {
  input: string
  setInput: (v: string) => void
  onSend: (text?: string) => void
  isStreaming: boolean
  chipsVisible: boolean
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
  chipsVisible,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleChip = (chip: Chip) => {
    if (isStreaming) return
    if (chip.prefill) {
      setInput(chip.prefill)
      setTimeout(() => textareaRef.current?.focus(), 0)
    } else if (chip.send) {
      onSend(chip.send)
    }
  }

  const canSend = input.trim().length > 0 && !isStreaming

  return (
    <div
      className="border-t border-border flex-shrink-0"
      style={{ padding: "12px 24px 20px" }}
    >
      {/* Chips */}
      {chipsVisible && (
        <div className="flex flex-wrap gap-2 mb-3">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChip(chip)}
              disabled={isStreaming}
              className="rounded-full border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
              style={{ fontSize: 12, padding: "4px 12px", background: "#16171c" }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-3 rounded-xl border border-border focus-within:border-border-strong transition-colors"
        style={{ background: "#111217", padding: "10px 12px" }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about tickers, layers, or your portfolio…"
          disabled={isStreaming}
          className="flex-1 bg-transparent text-text placeholder-text-muted resize-none outline-none"
          style={{ fontSize: 14, lineHeight: 1.5, minHeight: 24 }}
        />

        <button
          onClick={() => onSend()}
          disabled={!canSend}
          className="shrink-0 rounded-lg transition-colors flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: canSend ? "#a78bfa" : "#1a1b21",
            border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          {isStreaming ? (
            // Spinner
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <circle
                cx="7"
                cy="7"
                r="5"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="20 10"
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </svg>
          ) : (
            // Arrow up
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 11V3M3.5 6.5L7 3l3.5 3.5"
                stroke={canSend ? "#0a0b0e" : "#4b5563"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="text-text-muted mt-1.5 text-center" style={{ fontSize: 10 }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  )
}
