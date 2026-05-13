import { createClient } from "@/lib/supabase/server"
import AskChat from "@/components/ask/AskChat"
import type { Message } from "@/components/ask/ChatThread"

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function AskPage({ searchParams }: Props) {
  const supabase = createClient()
  const params = await searchParams
  const prefill = params.q ? decodeURIComponent(params.q) : undefined

  // When a prefill param is present, start a fresh conversation
  let initialMessages: Message[] = []
  let initialConversationId: string | null = null

  if (!prefill) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (conv) {
      initialConversationId = conv.id
      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conv.id)
        .order("created_at")
        .limit(50)

      initialMessages = (msgs ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    }
  }

  return (
    <AskChat
      initialMessages={initialMessages}
      initialConversationId={initialConversationId}
      initialInput={prefill}
    />
  )
}
