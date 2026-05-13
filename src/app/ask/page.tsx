import { createClient } from "@/lib/supabase/server"
import AskChat from "@/components/ask/AskChat"
import type { Message } from "@/components/ask/ChatThread"

export default async function AskPage() {
  const supabase = createClient()

  // Load the most recent conversation to restore on page reload
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let initialMessages: Message[] = []
  let initialConversationId: string | null = null

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

  return (
    <AskChat
      initialMessages={initialMessages}
      initialConversationId={initialConversationId}
    />
  )
}
