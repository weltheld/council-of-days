"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BackgroundScene,
  CampaignPhase,
  Group,
  Invitation,
  Member,
  User,
  Vote,
  VoteValue,
  Weekday,
} from "./types";
import {
  SEED_GROUP,
  SEED_INVITATIONS,
  SEED_MEMBERS,
  SEED_USERS,
  SEED_VOTES,
} from "./seed";

type CouncilState = {
  users: User[];
  groups: Group[];
  members: Member[];
  invitations: Invitation[];
  votes: Vote[];
  currentUserId: string | null;

  signIn: (email: string) => string;
  setProfile: (data: Pick<User, "characterName" | "displayName" | "avatarUrl">) => void;
  createGroup: (name: string, note: string) => Group;
  launchCampaign: (groupId: string) => void;
  setVote: (groupId: string, userId: string, date: string, value: VoteValue | null) => void;
  bulkFillVote: (
    groupId: string,
    userId: string,
    isoDates: string[],
    value: VoteValue,
  ) => void;
  setViableWeekdays: (groupId: string, weekdays: Weekday[]) => void;
  setBackground: (groupId: string, bg: BackgroundScene) => void;
  inviteByEmail: (groupId: string, email: string) => void;
  inviteExistingUser: (groupId: string, userId: string) => void;
  removeInvitation: (groupId: string, key: { userId?: string; email?: string }) => void;
  signOut: () => void;
  resetToSeed: () => void;
};

const seedState = {
  users: SEED_USERS,
  groups: [SEED_GROUP],
  members: SEED_MEMBERS,
  invitations: SEED_INVITATIONS,
  votes: SEED_VOTES,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32) || "campaign";
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
          creatorId: userId,
          dmId: userId,
          phase: "draft",
          viableWeekdays: [1, 2, 3, 4, 5] as Weekday[], // Mon-Fri default
          background: "tavern",
          createdAt: new Date().toISOString(),
        };
        const member: Member = {
          groupId: id,
          userId,
          role: "creator",
          joinedAt: group.createdAt,
        };
        set({
          groups: [...get().groups, group],
          members: [...get().members, member],
        });
        return group;
      },

      launchCampaign: (groupId) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId ? { ...g, phase: "live" as CampaignPhase } : g,
          ),
        });
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

      bulkFillVote: (groupId, userId, isoDates, value) => {
        const dateSet = new Set(isoDates);
        const others = get().votes.filter(
          (v) => !(v.groupId === groupId && v.userId === userId && dateSet.has(v.date)),
        );
        const newVotes: Vote[] = isoDates.map((date) => ({ groupId, userId, date, value }));
        set({ votes: [...others, ...newVotes] });
      },

      setViableWeekdays: (groupId, weekdays) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId ? { ...g, viableWeekdays: [...weekdays].sort() as Weekday[] } : g,
          ),
        });
      },

      setBackground: (groupId, bg) => {
        set({
          groups: get().groups.map((g) =>
            g.id === groupId ? { ...g, background: bg } : g,
          ),
        });
      },

      inviteByEmail: (groupId, email) => {
        const exists = get().invitations.find(
          (i) =>
            i.groupId === groupId &&
            i.email?.toLowerCase() === email.toLowerCase(),
        );
        if (exists) return;
        set({
          invitations: [
            ...get().invitations,
            { groupId, email, status: "queued", invitedAt: new Date().toISOString() },
          ],
        });
      },

      inviteExistingUser: (groupId, userId) => {
        const exists = get().invitations.find(
          (i) => i.groupId === groupId && i.userId === userId,
        );
        if (exists) return;
        set({
          invitations: [
            ...get().invitations,
            { groupId, userId, status: "queued", invitedAt: new Date().toISOString() },
          ],
        });
      },

      removeInvitation: (groupId, key) => {
        set({
          invitations: get().invitations.filter(
            (i) =>
              !(
                i.groupId === groupId &&
                ((key.userId && i.userId === key.userId) ||
                  (key.email &&
                    i.email?.toLowerCase() === key.email.toLowerCase()))
              ),
          ),
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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        users: s.users,
        groups: s.groups,
        members: s.members,
        invitations: s.invitations,
        votes: s.votes,
        currentUserId: s.currentUserId,
      }),
    },
  ),
);

// Helpers used by components

export function initialFor(user: User) {
  const src = user.characterName?.trim() || user.displayName?.trim() || user.email;
  return (src[0] || "?").toUpperCase();
}

export function shortAccountLabel(user: User) {
  return user.displayName?.trim().split(" ")[0] || user.email.split("@")[0];
}
