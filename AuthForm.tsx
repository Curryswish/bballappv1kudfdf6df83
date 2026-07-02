"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-hardwood-500 font-display text-xl font-extrabold text-white">
          R
        </div>
        <h1 className="font-display text-2xl font-extrabold">{mode === "login" ? "Welcome back" : "Join RunIt"}</h1>
        <p className="mt-1 text-sm text-court-900/50">
          {mode === "login" ? "Log in to find a game near you." : "Sign up to find and fill pickup games."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
            required
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          minLength={6}
          className="w-full rounded-xl border border-court-100 bg-white px-4 py-3 text-sm outline-none"
          required
        />

        {error && <p className="rounded-lg bg-rim-red/10 px-3 py-2 text-sm text-rim-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-hardwood-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-court-900/50">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-hardwood-600">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-hardwood-600">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
