-- RunIt initial schema
-- Run via: supabase db push  (or paste into the SQL editor in the Supabase dashboard)

create extension if not exists "uuid-ossp";

-- ---------- ENUM TYPES ----------
create type skill_level as enum ('beginner', 'intermediate', 'advanced', 'competitive');
create type game_type as enum ('2v2', '3v3', '5v5');
create type game_status as enum ('open', 'full', 'in_progress', 'finished', 'cancelled');

-- ---------- PROFILES ----------
-- One row per auth user. id matches auth.users.id.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  age int check (age is null or (age between 13 and 100)),
  city text,
  skill_level skill_level not null default 'beginner',
  profile_picture text,
  created_at timestamptz not null default now()
);

-- ---------- COURTS ----------
create table courts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  indoor boolean not null default false,
  paid boolean not null default false,
  lights_available boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

-- ---------- GAMES ----------
create table games (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references profiles (id) on delete cascade,
  court_id uuid not null references courts (id) on delete cascade,
  game_type game_type not null,
  skill_level skill_level not null default 'beginner',
  start_time timestamptz not null,
  max_players int not null check (max_players > 0),
  players_needed int not null check (players_needed >= 0),
  status game_status not null default 'open',
  created_at timestamptz not null default now()
);

create index games_court_id_idx on games (court_id);
create index games_start_time_idx on games (start_time);
create index games_status_idx on games (status);

-- ---------- PARTICIPANTS ----------
create table participants (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index participants_game_id_idx on participants (game_id);
create index participants_user_id_idx on participants (user_id);

-- ---------- MESSAGES ----------
create table messages (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index messages_game_id_created_at_idx on messages (game_id, created_at);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, skill_level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'beginner'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- KEEP players_needed / status IN SYNC WITH PARTICIPANTS ----------
create function sync_game_capacity()
returns trigger as $$
declare
  target_game_id uuid;
  filled int;
  cap int;
begin
  target_game_id := coalesce(new.game_id, old.game_id);

  select max_players into cap from games where id = target_game_id;
  select count(*) into filled from participants where game_id = target_game_id;

  update games
  set players_needed = greatest(cap - filled, 0),
      status = case
        when status in ('finished', 'cancelled', 'in_progress') then status
        when filled >= cap then 'full'
        else 'open'
      end
  where id = target_game_id;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_participants_change
  after insert or delete on participants
  for each row execute procedure sync_game_capacity();

-- ---------- AUTO-JOIN CREATOR AS FIRST PARTICIPANT ----------
create function add_creator_as_participant()
returns trigger as $$
begin
  insert into public.participants (game_id, user_id)
  values (new.id, new.creator_id)
  on conflict (game_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_game_created
  after insert on games
  for each row execute procedure add_creator_as_participant();

-- ---------- ROW LEVEL SECURITY ----------
alter table profiles enable row level security;
alter table courts enable row level security;
alter table games enable row level security;
alter table participants enable row level security;
alter table messages enable row level security;

-- Profiles: anyone signed in can read; users manage only their own row.
create policy "profiles are readable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');
create policy "users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Courts: readable by everyone signed in; writes are left to the dashboard/service role for MVP.
create policy "courts are readable by authenticated users"
  on courts for select using (auth.role() = 'authenticated');

-- Games: readable by everyone signed in; only the creator can update/delete their game.
create policy "games are readable by authenticated users"
  on games for select using (auth.role() = 'authenticated');
create policy "users can create games"
  on games for insert with check (auth.uid() = creator_id);
create policy "creators can update their games"
  on games for update using (auth.uid() = creator_id);
create policy "creators can delete their games"
  on games for delete using (auth.uid() = creator_id);

-- Participants: readable by everyone signed in; users can join/leave for themselves only.
create policy "participants are readable by authenticated users"
  on participants for select using (auth.role() = 'authenticated');
create policy "users can join games as themselves"
  on participants for insert with check (auth.uid() = user_id);
create policy "users can leave games they joined"
  on participants for delete using (auth.uid() = user_id);

-- Messages: only participants (or the creator) of a game can read/post in that game's chat.
create policy "game participants can read messages"
  on messages for select using (
    exists (
      select 1 from participants p
      where p.game_id = messages.game_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from games g where g.id = messages.game_id and g.creator_id = auth.uid()
    )
  );
create policy "game participants can send messages"
  on messages for insert with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from participants p
        where p.game_id = messages.game_id and p.user_id = auth.uid()
      )
      or exists (
        select 1 from games g where g.id = messages.game_id and g.creator_id = auth.uid()
      )
    )
  );

-- ---------- REALTIME ----------
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table games;
