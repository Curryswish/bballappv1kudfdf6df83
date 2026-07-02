/**
 * Seeds the RunIt database with sample data:
 *   10 courts, 20 users (with real auth accounts), 15 games, and starter chat messages.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings > API > service_role).
 * Never run this against production — it creates real auth users.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SKILLS = ["beginner", "intermediate", "advanced", "competitive"] as const;
const GAME_TYPES: { value: "2v2" | "3v3" | "5v5"; maxPlayers: number }[] = [
  { value: "2v2", maxPlayers: 4 },
  { value: "3v3", maxPlayers: 6 },
  { value: "5v5", maxPlayers: 10 },
];
const CITY = "Allen, TX";
const CITY_CENTER = { lat: 33.1032, lng: -96.6706 }; // Allen, TX

function jitter(base: number, spread = 0.05) {
  return base + (Math.random() - 0.5) * spread;
}

async function seedCourts() {
  const courts = Array.from({ length: 10 }).map(() => ({
    name: `${faker.location.street()} ${faker.helpers.arrayElement(["Rec Center", "Park Courts", "Community Gym", "Fieldhouse"])}`,
    address: faker.location.streetAddress({ useFullAddress: true }),
    latitude: jitter(CITY_CENTER.lat),
    longitude: jitter(CITY_CENTER.lng),
    indoor: faker.datatype.boolean(),
    paid: faker.datatype.boolean({ probability: 0.3 }),
    lights_available: faker.datatype.boolean({ probability: 0.6 }),
    description: faker.helpers.arrayElement([
      "Full court with two side hoops, gets busy after 6pm.",
      "Well-maintained outdoor court, resurfaced this year.",
      "Indoor gym, shoes required, quiet on weekday mornings.",
      "Popular run — bring a light jersey for teams.",
    ]),
  }));

  const { data, error } = await supabase.from("courts").insert(courts).select();
  if (error) throw error;
  console.log(`Seeded ${data.length} courts`);
  return data;
}

async function seedUsers() {
  const userIds: string[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "runit-seed-password",
      email_confirm: true,
      user_metadata: { display_name: `${firstName} ${lastName}` },
    });
    if (error) {
      console.warn(`Skipping ${email}: ${error.message}`);
      continue;
    }

    const userId = data.user.id;
    userIds.push(userId);

    // The handle_new_user trigger already created a bare profile row — fill it in.
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: `${firstName} ${lastName}`,
        age: faker.number.int({ min: 16, max: 45 }),
        city: CITY,
        skill_level: faker.helpers.arrayElement(SKILLS),
      })
      .eq("id", userId);
    if (updateError) throw updateError;
  }

  console.log(`Seeded ${userIds.length} users`);
  return userIds;
}

async function seedGames(courtIds: string[], userIds: string[]) {
  const gameIds: string[] = [];

  for (let i = 0; i < 15; i++) {
    const creator = faker.helpers.arrayElement(userIds);
    const court = faker.helpers.arrayElement(courtIds);
    const gameType = faker.helpers.arrayElement(GAME_TYPES);
    const startTime = faker.date.soon({ days: 10 });

    const { data: game, error } = await supabase
      .from("games")
      .insert({
        creator_id: creator,
        court_id: court,
        game_type: gameType.value,
        skill_level: faker.helpers.arrayElement(SKILLS),
        start_time: startTime.toISOString(),
        max_players: gameType.maxPlayers,
      })
      .select()
      .single();
    if (error) throw error;
    gameIds.push(game.id);

    // Join a handful of random players (creator is auto-joined by trigger).
    const others = faker.helpers.arrayElements(
      userIds.filter((id) => id !== creator),
      faker.number.int({ min: 0, max: gameType.maxPlayers - 1 })
    );
    for (const userId of others) {
      await supabase.from("participants").insert({ game_id: game.id, user_id: userId }).select();
    }

    // A couple of starter chat messages.
    const chatters = faker.helpers.arrayElements([creator, ...others], Math.min(2, others.length + 1));
    for (const senderId of chatters) {
      await supabase.from("messages").insert({
        game_id: game.id,
        sender_id: senderId,
        message: faker.helpers.arrayElement([
          "In, see everyone there.",
          "Anyone want to carpool?",
          "Running 10 min late, save me a spot.",
          "Is this full court or half?",
          "Bringing a friend if that's cool.",
        ]),
      });
    }
  }

  console.log(`Seeded ${gameIds.length} games`);
}

async function main() {
  const courts = await seedCourts();
  const userIds = await seedUsers();
  if (userIds.length === 0) throw new Error("No users were created — aborting game seed.");
  await seedGames(
    courts.map((c) => c.id),
    userIds
  );
  console.log("Done. Seed users all share the password: runit-seed-password");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
