import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageWithSender } from "@/lib/types";

export async function getMessages(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(`id, game_id, sender_id, message, created_at, sender:profiles ( id, display_name, profile_picture )`)
    .eq("game_id", gameId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as unknown as MessageWithSender[];
}

export async function sendMessage(supabase: SupabaseClient, gameId: string, senderId: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;

  const { error } = await supabase.from("messages").insert({
    game_id: gameId,
    sender_id: senderId,
    message: trimmed,
  });
  if (error) throw error;
}
