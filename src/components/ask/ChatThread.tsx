import { useEffect, useRef } from "react"

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
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
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
        <div
          className="text-text-secondary"
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
          {streaming && (
            <span
              className="inline-block rounded-sm"
              style={{
                width: 7,
                height: 14,
                background: "#a78bfa",
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
