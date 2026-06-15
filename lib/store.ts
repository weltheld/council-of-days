"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Group, Invite, Member, User, Vote, VoteValue } from "./types";
import {
  SEED_GROUP,
  SEED_INVITES,
  SEED_MEMBERS,
  SEED_USERS,
  SEED_VOTES,
} from "./seed";

type CouncilState = {
  users: User[];
  groups: Group[];
  members: Member[];
  invites: Invite[];
  votes: Vote[];
  currentUserId: string | null;

  signIn: (email: string) => string;
  setProfile: (data: Pick<User, "characterName" | "displayName" | "avatarUrl">) => void;
  createGroup: (name: string, note: string) => Group;
  setVote: (groupId: string, userId: string, date: string, value: VoteValue | null) => void;
  invitePlayer: (groupId: string, email: string) => void;
  signOut: () => void;
  resetToSeed: () => void;
};

const seedState = {
  users: SEED_USERS,
  groups: [SEED_GROUP],
  members: SEED_MEMBERS,
  invites: SEED_INVITES,
  votes: SEED_VOTES,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32) || "company";
}

export const useCouncil = create<CouncilState>()(
  persist(
    (set, get) => ({
      ...seedState,
      currentUserId: null,

      signIn: (email) => {
        const existing = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          set({ currentUserId: existing.id });
          return existing.id;
        }
        const id = `u_${Math.random().toString(36).slice(2, 8)}`;
        const newUser: User = {
          id,
          email,
          displayName: "",
          characterName: "",
        };
        set({ users: [...get().users, newUser], currentUserId: id });
        return id;
      },

      setProfile: ({ characterName, displayName, avatarUrl }) => {
        const id = get().currentUserId;
        if (!id) return;
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, characterName, displayName, avatarUrl: avatarUrl ?? u.avatarUrl } : u,
          ),
        });
      },

      createGroup: (name, note) => {
        const id = `g_${Math.random().toString(36).slice(2, 8)}`;
        const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
        const userId = get().currentUserId!;
        const group: Group = {
          id,
          slug,
          name,
          note,
          dmId: userId,
          createdAt: new Date().toISOString(),
        };
        const member: Member = {
          groupId: id,
          userId,
          role: "dm",
          joinedAt: group.createdAt,
        };
        set({
          groups: [...get().groups, group],
          members: [...get().members, member],
        });
        return group;
      },

      setVote: (groupId, userId, date, value) => {
        const others = get().votes.filter(
          (v) => !(v.groupId === groupId && v.userId === userId && v.date === date),
        );
        if (value === null) {
          set({ votes: others });
        } else {
          set({ votes: [...others, { groupId, userId, date, value }] });
        }
      },

      invitePlayer: (groupId, email) => {
        const exists = get().invites.find(
          (i) => i.groupId === groupId && i.email.toLowerCase() === email.toLowerCase(),
        );
        if (exists) return;
        set({
          invites: [
            ...get().invites,
            { groupId, email, status: "pending", invitedAt: new Date().toISOString() },
          ],
        });
      },

      signOut: () => set({ currentUserId: null }),

      resetToSeed: () =>
        set({
          ...seedState,
          currentUserId: null,
        }),
    }),
    {
      name: "council-of-days-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        users: s.users,
        groups: s.groups,
        members: s.members,
        invites: s.invites,
        votes: s.votes,
        currentUserId: s.currentUserId,
      }),
    },
  ),
);

// Selectors
export function selectGroupBySlug(slug: string) {
  return useCouncil.getState().groups.find((g) => g.slug === slug);
}

export function selectMembersOf(groupId: string) {
  const { members, users } = useCouncil.getState();
  return members
    .filter((m) => m.groupId === groupId)
    .map((m) => {
      const user = users.find((u) => u.id === m.userId)!;
      return { ...m, user };
    });
}

export function selectVotesFor(groupId: string, date: string) {
  return useCouncil.getState().votes.filter((v) => v.groupId === groupId && v.date === date);
}

export function selectDayBest(groupId: string, days: string[], dmId: string) {
  const { votes } = useCouncil.getState();
  let bestDate: string | null = null;
  let bestScore = -1;
  for (const d of days) {
    const dayVotes = votes.filter((v) => v.groupId === groupId && v.date === d);
    const dmFree = dayVotes.some((v) => v.userId === dmId && v.value === "yes");
    if (!dmFree) continue;
    const yes = dayVotes.filter((v) => v.value === "yes").length;
    if (yes > bestScore) {
      bestScore = yes;
      bestDate = d;
    }
  }
  return bestDate;
}

export function initialFor(user: User) {
  const src = user.characterName?.trim() || user.displayName?.trim() || user.email;
  return (src[0] || "?").toUpperCase();
}
