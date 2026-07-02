"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage } from "@/lib/api/messages";
import type { MessageWithSender } from "@/lib/types";
import { format } from "date-fns";

export default function Chat({ gameId, currentUserId }: { gameId: string; currentUserId: string }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMessages(supabase, gameId).then((initial) => {
      if (!cancelled) setMessages(initial);
    });

    const channel = supabase
      .channel(`messages:${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `game_id=eq.${gameId}` },
        async (payload) => {
          // The realtime payload has no joined sender profile, so fetch the sender once.
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, display_name, profile_picture")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              id: payload.new.id,
              game_id: payload.new.game_id,
              sender_id: payload.new.sender_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              sender: sender ?? { id: payload.new.sender_id, display_name: "Player", profile_picture: null },
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage(supabase, gameId, currentUserId, text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-card border border-court-100 bg-white shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-court-900/40">
            No messages yet. Say hi and lock in the details.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="mb-0.5 px-1 text-[11px] font-medium text-court-900/40">{m.sender.display_name}</span>}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-hardwood-500 text-white" : "bg-court-100 text-court-900"
                }`}
              >
                {m.message}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-court-900/30">{format(new Date(m.created_at), "h:mm a")}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-court-100 px-3 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the game…"
          className="flex-1 rounded-full border border-court-100 bg-court-25 px-4 py-2.5 text-sm outline-none"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="flex-none rounded-full bg-hardwood-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
