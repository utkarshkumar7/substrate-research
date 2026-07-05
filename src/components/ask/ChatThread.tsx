import { useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export interface Message {
  role: "user" | "assistant"
  content: string
}

interface Props {
  messages: Message[]
  streamingText: string
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-4">
      <div
        className="rounded-xl text-text"
        style={{
          background: "#1a1b21",
          border: "1px solid #2a2c33",
          padding: "10px 14px",
          maxWidth: "72%",
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
    </div>
  )
}

function AssistantBubble({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3 mb-4">
      {/* Gradient bullet matching brand mark */}
      <div className="shrink-0 mt-1" style={{ width: 10, height: 10 }}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <defs>
            <radialGradient id="brand-dot" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#f6c489" />
              <stop offset="100%" stopColor="#e07b3a" />
            </radialGradient>
          </defs>
          <circle cx="5" cy="5" r="5" fill="url(#brand-dot)" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {/* Subtitle */}
        <div className="text-text-muted mb-1.5" style={{ fontSize: 10, letterSpacing: "0.04em" }}>
          grounded in your topology · latest prices · 1y correlation data
        </div>

        {/* Content */}
        <div className="text-text-secondary prose-chat">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 8, color: "#9ca3af" }}>{children}</p>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#e8e9ec", marginBottom: 6, marginTop: 14, letterSpacing: "0.02em" }}>{children}</h3>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e8e9ec", marginBottom: 8, marginTop: 16 }}>{children}</h2>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600, color: "#e8e9ec" }}>{children}</strong>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: 16, marginBottom: 8 }}>{children}</ul>
              ),
              li: ({ children }) => (
                <li style={{ fontSize: 14, lineHeight: 1.7, color: "#9ca3af", marginBottom: 2 }}>{children}</li>
              ),
              hr: () => <hr style={{ borderColor: "#1f2127", margin: "12px 0" }} />,
              table: ({ children }) => (
                <div style={{ overflowX: "auto", marginBottom: 10 }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{ padding: "4px 10px", textAlign: "left", color: "#6b7280", fontWeight: 500, borderBottom: "1px solid #1f2127", whiteSpace: "nowrap" }}>{children}</th>
              ),
              td: ({ children }) => (
                <td style={{ padding: "4px 10px", color: "#9ca3af", borderBottom: "1px solid #111217", whiteSpace: "nowrap" }}>{children}</td>
              ),
              code: ({ children }) => (
                <code style={{ fontSize: 12, background: "#16171c", padding: "1px 5px", borderRadius: 4, color: "#f0a24e", fontFamily: "monospace" }}>{children}</code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
          {streaming && (
            <span
              className="inline-block rounded-sm"
              style={{
                width: 7,
                height: 14,
                background: "#f0a24e",
                opacity: 0.9,
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatThread({ messages, streamingText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: "24px 32px 16px" }}>
      {messages.length === 0 && !streamingText && (
        <div className="flex flex-col items-center justify-center h-full" style={{ paddingBottom: 80 }}>
          <div
            className="font-semibold text-text mb-2"
            style={{ fontSize: 18 }}
          >
            Ask about your supply chain
          </div>
          <p className="text-text-muted text-center" style={{ fontSize: 13, maxWidth: 360 }}>
            Grounded in your topology, latest prices, and recent signals.
            <br />Try a question below to get started.
          </p>
        </div>
      )}

      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <UserBubble key={i} content={msg.content} />
        ) : (
          <AssistantBubble key={i} content={msg.content} />
        )
      )}

      {streamingText && <AssistantBubble content={streamingText} streaming />}

      <div ref={bottomRef} />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
