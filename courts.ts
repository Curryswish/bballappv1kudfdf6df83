import type { SupabaseClient } from "@supabase/supabase-js";
import type { Court, CourtWithGameCount } from "@/lib/types";

/** All courts with a count of currently open/full (i.e. not finished) games at each. */
export async function getCourtsWithGameCounts(supabase: SupabaseClient) {
  const { data: courts, error } = await supabase.from("courts").select("*").order("name");
  if (error) throw error;

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("court_id, status")
    .in("status", ["open", "full"]);
  if (gamesError) throw gamesError;

  const counts = new Map<string, number>();
  for (const g of games ?? []) {
    counts.set(g.court_id, (counts.get(g.court_id) ?? 0) + 1);
  }

  return (courts ?? []).map((c: Court) => ({
    ...c,
    active_game_count: counts.get(c.id) ?? 0,
  })) as CourtWithGameCount[];
}

export async function getCourt(supabase: SupabaseClient, courtId: string) {
  const { data, error } = await supabase.from("courts").select("*").eq("id", courtId).single();
  if (error) throw error;
  return data as Court;
}
