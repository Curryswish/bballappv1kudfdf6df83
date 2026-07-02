# RunIt

Find and fill pickup basketball games, in real time. This is a deliberately small MVP: the only
question it's built to answer is **"will strangers use an app to find and fill pickup basketball
games?"** — everything else (rankings, AI matching, payments) is left out on purpose.

## Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Supabase (Postgres, Auth, Realtime, Row Level Security) |
| Maps | Google Maps JavaScript API |
| Hosting | Vercel |

No custom backend, no microservices, no queues — Supabase does auth, the database, and realtime
chat for you.

## Project structure

```
runit/
├── supabase/
│   └── migrations/0001_init.sql   # full schema, RLS policies, triggers
├── scripts/seed.ts                # generates sample courts/users/games
├── src/
│   ├── app/                       # pages (App Router)
│   │   ├── page.tsx               # "/" — Games Near You feed
│   │   ├── login/, signup/
│   │   ├── profile/
│   │   ├── courts/, courts/[id]/
│   │   ├── create-game/
│   │   └── games/[id]/            # game detail + realtime chat
│   ├── components/                # GameCard, CourtCard, Chat, BottomNav, ...
│   └── lib/
│       ├── supabase/              # browser + server Supabase clients
│       ├── api/                   # typed data-access functions (games, courts, profiles, messages)
│       └── types.ts               # shared TypeScript interfaces
```

## Database schema

Five tables, defined in `supabase/migrations/0001_init.sql`:

- **profiles** — id, display_name, age, city, skill_level, profile_picture
- **courts** — id, name, address, latitude, longitude, indoor, paid, lights_available, description
- **games** — id, creator_id, court_id, game_type (2v2/3v3/5v5), start_time, max_players, players_needed, status
- **participants** — game_id, user_id (who's joined a game)
- **messages** — game_id, sender_id, message, created_at (game chat)

Triggers handle the busywork so the frontend doesn't have to:
- A new `auth.users` row automatically gets a matching `profiles` row.
- A new game automatically joins its creator as the first participant.
- `players_needed` and `status` (`open` → `full`) recalculate automatically whenever someone
  joins or leaves.

Row Level Security is on for every table. Signed-in users can read everything relevant to them;
they can only write their own profile, their own games, their own participation, and messages in
games they've joined.

## Running locally

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. In **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`.
3. In **Authentication → Providers → Email**, turn **off** "Confirm email" while you're testing
   locally — otherwise every signup needs a real inbox to click a confirmation link.
4. In **Project Settings → API**, copy the Project URL, `anon` public key, and `service_role`
   secret key.

### 2. Get a Google Maps key

Enable the **Maps JavaScript API** in Google Cloud Console, create a key, and restrict it to your
local/production domains. (The app runs fine without one — the court map just shows a placeholder.)

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (seed script only), and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on `/login` since there's no
session yet — sign up, and you're in.

### 5. (Optional) Seed sample data

```bash
npm run seed
```

This creates 10 courts, 20 real auth users (password `runit-seed-password` for all of them), and
15 games with a few starter chat messages — enough to make the feed feel alive while you demo it.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), **New Project** → import the repo.
3. Add the same environment variables from `.env` (skip `SUPABASE_SERVICE_ROLE_KEY` — it's only
   needed for the local seed script, never for the deployed app).
4. Deploy. Vercel auto-detects Next.js — no build config needed.
5. Back in Supabase, turn "Confirm email" back on for production, and add your Vercel domain to
   Google Cloud's Maps API key restrictions.

## What's deliberately not in the MVP

Rankings, AI-based matching, subscriptions, leagues, a social feed, and payments are all cut for
now. The entire point of this build is to test one behavior — do strangers actually create and
join games — before spending time on anything else.

## Suggested next features, in order

1. **Push notifications** (Firebase) — "a spot opened up in your game," "game starts in 1 hour."
2. **Queue mode** — "I have 2 people, find us 2 more" / solo "I'm available tonight" matching.
3. **Court intelligence** — busiest times, indoor/outdoor mix, crowdsourced from game history.
4. **Boosted listings** — $2–5 to push a game to the top of the court feed (first monetization test).
5. **Leave-a-review / no-show tracking** — lightweight trust signal before adding anything heavier.
6. Only after retention and repeat usage are proven: premium tier, gym/rec-center partnerships,
   and expansion beyond basketball.
