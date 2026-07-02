"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProfile, updateProfile } from "@/lib/api/profiles";
import type { Profile, SkillLevel } from "@/lib/types";
import Header from "@/components/Header";

const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced", "competitive"];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const p = await getProfile(supabase, user.id);
      setProfile(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile(supabase, profile.id, {
        display_name: profile.display_name,
        age: profile.age,
        city: profile.city,
        skill_level: profile.skill_level,
      });
      setProfile(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!profile) {
    return (
      <>
        <Header title="Profile" />
        <div className="px-5 text-sm text-court-900/40">Loading…</div>
      </>
    );
  }

  return (
    <>
      <Header title="Profile" subtitle="Keep this current so hosts know who's showing up." />

      <form onSubmit={handleSave} className="space-y-5 px-5">
        <Field label="Display name">
          <input
            value={profile.display_name}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
            required
          />
        </Field>

        <Field label="Age">
          <input
            type="number"
            min={13}
            max={100}
            value={profile.age ?? ""}
            onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })}
            className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="City">
          <input
            value={profile.city ?? ""}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Skill level">
          <select
            value={profile.skill_level}
            onChange={(e) => setProfile({ ...profile, skill_level: e.target.value as SkillLevel })}
            className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm capitalize outline-none"
          >
            {SKILL_LEVELS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </Field>

        {saved && <p className="rounded-lg bg-rim-green/10 px-3 py-2 text-sm text-rim-green">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-hardwood-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-xl border border-court-100 py-3 text-sm font-semibold text-court-900/60"
        >
          Log out
        </button>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-court-900/70">{label}</span>
      {children}
    </label>
  );
}
