export type SkillLevel = "beginner" | "intermediate" | "advanced" | "competitive";
export type GameType = "2v2" | "3v3" | "5v5";
export type GameStatus = "open" | "full" | "in_progress" | "finished" | "cancelled";

export interface Profile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  skill_level: SkillLevel;
  profile_picture: string | null;
  created_at: string;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  paid: boolean;
  lights_available: boolean;
  description: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  creator_id: string;
  court_id: string;
  game_type: GameType;
  skill_level: SkillLevel;
  start_time: string;
  max_players: number;
  players_needed: number;
  status: GameStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  game_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  game_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

// ---- Composed shapes used by the UI (joined queries) ----

export interface GameWithCourt extends Game {
  court: Pick<Court, "id" | "name" | "indoor" | "paid" | "latitude" | "longitude">;
  participant_count?: number;
}

export interface GameWithDetails extends Game {
  court: Court;
  creator: Pick<Profile, "id" | "display_name" | "skill_level" | "profile_picture">;
  participants: (Participant & { profile: Pick<Profile, "id" | "display_name" | "profile_picture" | "skill_level"> })[];
}

export interface CourtWithGameCount extends Court {
  active_game_count: number;
}

export interface MessageWithSender extends Message {
  sender: Pick<Profile, "id" | "display_name" | "profile_picture">;
}
