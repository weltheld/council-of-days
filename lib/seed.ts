import type {
  Group,
  Invitation,
  Member,
  User,
  Vote,
  VoteValue,
  Weekday,
} from "./types";

export const SEED_USERS: User[] = [
  {
    id: "u_mara",
    email: "mara@example.com",
    displayName: "Mara Voss",
    characterName: "Mara Voss",
    avatarUrl: "/images/avatar-mara.png",
  },
  {
    id: "u_jonas",
    email: "jonas@tablemail.de",
    displayName: "Jonas Weber",
    characterName: "Torgrim Stonebeard",
    avatarUrl: "/images/avatar-torgrim.png",
  },
  {
    id: "u_lena",
    email: "lena@moonmail.de",
    displayName: "Lena Fischer",
    characterName: "Sylvara Moonwhisper",
    avatarUrl: "/images/avatar-sylvara.png",
  },
  {
    id: "u_felix",
    email: "felix.hoge@example.com",
    displayName: "Felix Hoge",
    characterName: "Alaric the Gray",
    avatarUrl: "/images/avatar-alaric.png",
  },
  {
    id: "u_aylin",
    email: "aylin@nightmail.de",
    displayName: "Aylin Demir",
    characterName: "Nyx",
    avatarUrl: "/images/avatar-nyx.png",
  },
  {
    id: "u_ben",
    email: "ben@clericmail.com",
    displayName: "Ben Carter",
    characterName: "Brother Aldous",
    avatarUrl: "/images/avatar-aldous.png",
  },
];

export const SEED_GROUP: Group = {
  id: "g_emberfall",
  slug: "emberfall",
  name: "The Emberfall Company",
  note: "A band of unlikely heroes seeking the Ember Crown.",
  creatorId: "u_mara",
  dmId: "u_mara",
  phase: "live",
  // Default to weekdays only — the design shows weekends as non-viable.
  viableWeekdays: [1, 2, 3, 4, 5] as Weekday[],
  // New Pencil design uses parchment as the default scene for the
  // group view (dark ink reads against it). DM can switch in Poll Settings.
  background: "parchment",
  createdAt: "2026-06-01T00:00:00.000Z",
};

export const SEED_MEMBERS: Member[] = SEED_USERS.map((u) => ({
  groupId: SEED_GROUP.id,
  userId: u.id,
  role: u.id === SEED_GROUP.creatorId ? "creator" : "participant",
  joinedAt: "2026-06-01T00:00:00.000Z",
}));

export const SEED_INVITATIONS: Invitation[] = [];

// Recreates the vote pattern visible in the Group — Desktop · Member screen.
// Note: in the new design weekends are non-viable by default, so we keep all
// seeded votes on Mon–Fri.
type SeedVote = { date: string; votes: Record<string, VoteValue> };

const SEED_VOTE_DAYS: SeedVote[] = [
  // Day 18 (Thu) shows 1 maybe + 1 no in the design
  { date: "2026-06-18", votes: { u_jonas: "maybe", u_ben: "no" } },
  // Day 19 (Fri) is BEST DAY — 3 yes, 1 maybe, 1 no, user voted yes
  { date: "2026-06-19", votes: { u_mara: "yes", u_jonas: "yes", u_lena: "yes", u_felix: "yes", u_aylin: "maybe", u_ben: "no" } },
  // Day 24 (Wed) shows 1 maybe + 1 no, user voted no
  { date: "2026-06-24", votes: { u_aylin: "maybe", u_ben: "no", u_felix: "no" } },
  // Day 26 (Fri) shows 2 yes + 1 maybe, user voted maybe
  { date: "2026-06-26", votes: { u_mara: "yes", u_jonas: "yes", u_felix: "maybe" } },
];

export const SEED_VOTES: Vote[] = SEED_VOTE_DAYS.flatMap(({ date, votes }) =>
  Object.entries(votes).map(([userId, value]) => ({
    groupId: SEED_GROUP.id,
    userId,
    date,
    value,
  })),
);
