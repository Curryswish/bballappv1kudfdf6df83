import Link from "next/link";
import { format } from "date-fns";
import Badge from "./Badge";
import type { GameWithCourt } from "@/lib/types";

const SKILL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  competitive: "Competitive",
};

export default function GameCard({ game }: { game: GameWithCourt }) {
  const isFull = game.status === "full";

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex gap-4 rounded-card border border-court-100 bg-white p-4 shadow-card transition active:scale-[0.99]"
    >
      {/* Scoreboard digit — the signature element: spots needed, big and numeric */}
      <div className="flex w-16 flex-none flex-col items-center justify-center rounded-2xl bg-court-900 text-white">
        <span className="font-mono text-2xl leading-none tabular-nums">
          {isFull ? "0" : game.players_needed}
        </span>
        <span className="mt-1 text-[9px] uppercase tracking-wider text-white/60">
          {isFull ? "full" : "needed"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-display text-base font-bold">{game.game_type}</span>
          <Badge tone={isFull ? "red" : "green"}>{isFull ? "Full" : "Open"}</Badge>
        </div>

        <p className="truncate text-sm font-medium text-court-900/80">{game.court.name}</p>
        <p className="text-sm text-court-900/50">{format(new Date(game.start_time), "EEE, MMM d · h:mm a")}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="amber">{SKILL_LABEL[game.skill_level] ?? game.skill_level}</Badge>
          <Badge>{game.court.indoor ? "Indoor" : "Outdoor"}</Badge>
        </div>
      </div>
    </Link>
  );
}
