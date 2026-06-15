export type VoteValue = "yes" | "maybe" | "no";

export type User = {
  id: string;
  email: string;
  displayName: string;
  characterName: string;
  avatarUrl?: string;
};

export type Group = {
  id: string;
  slug: string;
  name: string;
  note?: string;
  dmId: string;
  createdAt: string;
};

export type Member = {
  groupId: string;
  userId: string;
  role: "dm" | "player";
  joinedAt: string;
};

export type Invite = {
  groupId: string;
  email: string;
  status: "pending" | "joined";
  invitedAt: string;
};

export type Vote = {
  groupId: string;
  userId: string;
  date: string;
  value: VoteValue;
};

export type Session = { userId: string | null };
