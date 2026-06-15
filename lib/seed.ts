import type { Group, Invite, Member, User, Vote, VoteValue } from "./types";

export const SEED_USERS: User[] = [
  {
    id: "u_mara",
    email: "mara@example.com",
    displayName: "Mara Voss",
    characterName: "Mara Voss",
    avatarUrl: "/images/avatar-mara.svg",
  },
  {
    id: "u_jonas",
    email: "jonas@example.com",
    displayName: "Jonas Weber",
    characterName: "Torgrim Stonebeard",
    avatarUrl: "/images/avatar-torgrim.svg",
  },
  {
    id: "u_lena",
    email: "lena@example.com",
    displayName: "Lena Fischer",
    characterName: "Sylvara Moonwhisper",
    avatarUrl: "/images/avatar-sylvara.svg",
  },
  {
    id: "u_felix",
    email: "felix@example.com",
    displayName: "Felix Hoge",
    characterName: "Alaric the Gray",
    avatarUrl: "/images/avatar-alaric.svg",
  },
  {
    id: "u_aylin",
    email: "aylin@example.com",
    displayName: "Aylin Demir",
    characterName: "Nyx",
    avatarUrl: "/images/avatar-nyx.svg",
  },
  {
    id: "u_ben",
    email: "ben@example.com",
    displayName: "Ben Carter",
    characterName: "Brother Aldous",
    avatarUrl: "/images/avatar-aldous.svg",
  },
];

export const SEED_GROUP: Group = {
  id: "g_emberfall",
  slug: "emberfall",
  name: "The Emberfall Company",
  note: "A band of unlikely heroes seeking the Ember Crown.",
  dmId: "u_mara",
  createdAt: "2026-06-01T00:00:00.000Z",
};

export const SEED_MEMBERS: Member[] = SEED_USERS.map((u) => ({
  groupId: SEED_GROUP.id,
  userId: u.id,
  role: u.id === SEED_GROUP.dmId ? "dm" : "player",
  joinedAt: "2026-06-01T00:00:00.000Z",
}));

export const SEED_INVITES: Invite[] = [
  { groupId: SEED_GROUP.id, email: "ben.carter@web.de", status: "pending", invitedAt: "2026-06-02T00:00:00.000Z" },
];

// Recreates the vote pattern visible in the Group — Desktop screen.
// Mara (DM) is free Fri & Sat; players cast a mix of yes/maybe/no.
type SeedVote = { date: string; votes: Record<string, VoteValue> };

const SEED_VOTE_DAYS: SeedVote[] = [
  { date: "2026-06-13", votes: { u_jonas: "yes", u_lena: "yes", u_aylin: "yes" } },
  { date: "2026-06-14", votes: { u_jonas: "yes", u_ben: "yes" } },
  { date: "2026-06-19", votes: { u_mara: "yes", u_jonas: "yes", u_lena: "yes", u_felix: "yes", u_aylin: "maybe", u_ben: "no" } },
  { date: "2026-06-20", votes: { u_mara: "yes", u_jonas: "yes", u_lena: "yes", u_aylin: "yes" } },
  { date: "2026-06-21", votes: { u_mara: "yes", u_lena: "yes", u_felix: "yes", u_ben: "maybe" } },
  { date: "2026-06-24", votes: { u_aylin: "yes", u_ben: "yes" } },
  { date: "2026-06-26", votes: { u_mara: "yes", u_jonas: "yes", u_lena: "yes", u_ben: "yes" } },
  { date: "2026-06-27", votes: { u_mara: "yes", u_jonas: "yes", u_felix: "yes", u_aylin: "yes" } },
];

export const SEED_VOTES: Vote[] = SEED_VOTE_DAYS.flatMap(({ date, votes }) =>
  Object.entries(votes).map(([userId, value]) => ({
    groupId: SEED_GROUP.id,
    userId,
    date,
    value,
  })),
);
