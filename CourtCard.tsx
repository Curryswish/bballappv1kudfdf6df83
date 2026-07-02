import Link from "next/link";
import Badge from "./Badge";
import type { CourtWithGameCount } from "@/lib/types";

export default function CourtCard({ court }: { court: CourtWithGameCount }) {
  return (
    <Link
      href={`/courts/${court.id}`}
      className="flex items-center justify-between gap-3 rounded-card border border-court-100 bg-white p-4 shadow-card transition active:scale-[0.99]"
    >
      <div className="min-w-0">
        <p className="truncate font-display text-base font-bold">{court.name}</p>
        <p className="truncate text-sm text-court-900/50">{court.address}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{court.indoor ? "Indoor" : "Outdoor"}</Badge>
          <Badge tone={court.paid ? "red" : "green"}>{court.paid ? "Paid" : "Free"}</Badge>
          {court.lights_available && <Badge>Lights</Badge>}
        </div>
      </div>

      <div className="flex flex-none flex-col items-center justify-center rounded-2xl bg-hardwood-50 px-3 py-2 text-hardwood-600">
        <span className="font-mono text-lg font-semibold leading-none tabular-nums">{court.active_game_count}</span>
        <span className="mt-1 text-[9px] uppercase tracking-wide">live</span>
      </div>
    </Link>
  );
}
