import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameStatus, GameType, GameWithCourt, GameWithDetails, SkillLevel } from "@/lib/types";

const OPEN_STATUSES: GameStatus[] = ["open", "full"];

/** Games happening soon, newest-starting-first, for the home feed / court detail page. */
export async function getUpcomingGames(
  supabase: SupabaseClient,
  opts: { courtId?: string; limit?: number } = {}
) {
  let query = supabase
    .from("games")
    .select(
      `id, creator_id, court_id, game_type, skill_level, start_time, max_players, players_needed, status, created_at,
       court:courts ( id, name, indoor, paid, latitude, longitude )`
    )
    .in("status", OPEN_STATUSES)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(opts.limit ?? 50);

  if (opts.courtId) query = query.eq("court_id", opts.courtId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as GameWithCourt[];
}

/** Full detail for a single game: court, creator, and the roster of joined players. */
export async function getGameDetails(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `*,
       court:courts ( * ),
       creator:profiles!games_creator_id_fkey ( id, display_name, skill_level, profile_picture ),
       participants ( id, game_id, user_id, joined_at, profile:profiles ( id, display_name, profile_picture, skill_level ) )`
    )
    .eq("id", gameId)
    .single();

  if (error) throw error;
  return data as unknown as GameWithDetails;
}

export interface CreateGameInput {
  creator_id: string;
  court_id: string;
  game_type: GameType;
  skill_level: SkillLevel;
  start_time: string; // ISO string
  max_players: number;
}

export async function createGame(supabase: SupabaseClient, input: CreateGameInput) {
  const { data, error } = await supabase
    .from("games")
    .insert({ ...input, players_needed: input.max_players })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinGame(supabase: SupabaseClient, gameId: string, userId: string) {
  const { error } = await supabase.from("participants").insert({ game_id: gameId, user_id: userId });
  if (error) throw error;
}

export async function leaveGame(supabase: SupabaseClient, gameId: string, userId: string) {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function isUserInGame(supabase: SupabaseClient, gameId: string, userId: string) {
  const { data, error } = await supabase
    .from("participants")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
