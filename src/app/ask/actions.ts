"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Clears all Ask-Claude chat history (conversations + messages).
 * Next.js owns the conversations/messages tables, so this is a permitted write.
 */
export async function clearChatHistory(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  const { error: msgErr } = await supabase.from("messages").delete().not("id", "is", null);
  if (msgErr) return { ok: false, error: msgErr.message };

  const { error: convErr } = await supabase.from("conversations").delete().not("id", "is", null);
  if (convErr) return { ok: false, error: convErr.message };

  return { ok: true };
}
