"use client"

import { useState } from "react"
import ChatThread, { type Message } from "./ChatThread"
import ChatInput from "./ChatInput"

interface Props {
  initialMessages: Message[]
  initialConversationId: string | null
}

export default function AskChat({ initialMessages, initialConversationId }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [input, setInput] = useState("")
  const [chipsVisible, setChipsVisible] = useState(initialMessages.length === 0)

  const send = async (chipText?: string) => {
    const text = chipText ?? input.trim()
    if (!text || isStreaming) return

    setInput("")
    setChipsVisible(false)
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setIsStreaming(true)
    setStreamingText("")

    let currentText = ""

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, user_message: text }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newline
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "init" && data.conversation_id) {
                setConversationId(data.conversation_id)
              } else if (data.type === "delta") {
                currentText += data.text
                setStreamingText(currentText)
              } else if (data.type === "done") {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: currentText },
                ])
                setStreamingText("")
              } else if (data.type === "error") {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: `Error: ${data.message}` },
                ])
                setStreamingText("")
              }
            } catch {
              // malformed JSON line — skip
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Connection error: ${String(err)}` },
      ])
      setStreamingText("")
    } finally {
      setIsStreaming(false)
      setStreamingText("")
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <ChatThread messages={messages} streamingText={streamingText} />
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={send}
        isStreaming={isStreaming}
        chipsVisible={chipsVisible}
      />
    </div>
  )
}
