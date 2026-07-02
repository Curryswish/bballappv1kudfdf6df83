"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { joinGame, leaveGame } from "@/lib/api/games";

export default function JoinLeaveButton({
  gameId,
  userId,
  isJoined,
  isFull,
  isCreator,
}: {
  gameId: string;
  userId: string;
  isJoined: boolean;
  isFull: boolean;
  isCreator: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isCreator) {
    return (
      <div className="rounded-xl bg-court-100 py-3 text-center text-sm font-semibold text-court-900/60">
        You created this game
      </div>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      if (isJoined) {
        await leaveGame(supabase, gameId, userId);
      } else {
        await joinGame(supabase, gameId, userId);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || (!isJoined && isFull);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 ${
        isJoined ? "bg-rim-red" : "bg-hardwood-500"
      }`}
    >
      {loading ? "Please wait…" : isJoined ? "Leave game" : isFull ? "Game is full" : "Join game"}
    </button>
  );
}
