import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, SkillLevel } from "@/lib/types";

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data as Profile;
}

export interface UpdateProfileInput {
  display_name?: string;
  age?: number | null;
  city?: string | null;
  skill_level?: SkillLevel;
  profile_picture?: string | null;
}

export async function updateProfile(supabase: SupabaseClient, userId: string, input: UpdateProfileInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
