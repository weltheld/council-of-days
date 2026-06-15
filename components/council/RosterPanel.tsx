"use client";

import { Crown } from "lucide-react";
import { Avatar } from "./Avatar";
import { Legend } from "./Legend";
import { VoteChip } from "./VoteChip";
import type { Member, User, Vote, VoteValue } from "@/lib/types";
import { cn } from "@/lib/utils";

type MemberWithUser = Member & { user: User };

type Props = {
  members: MemberWithUser[];
  dmId: string;
  focusedDate: string | null;
  votesForFocusedDay: Vote[];
};

function dmNote(votes: Vote[], dmId: string) {
  const dmVote = votes.find((v) => v.userId === dmId);
  if (!dmVote) return "Her days rule the calendar";
  return dmVote.value === "yes"
    ? "She is in — the table can convene."
    : dmVote.value === "maybe"
      ? "She may join — keep the seat warm."
      : "She is out — choose another day.";
}

export function RosterPanel({ members, dmId, focusedDate, votesForFocusedDay }: Props) {
  const dm = members.find((m) => m.userId === dmId);
  const party = members.filter((m) => m.userId !== dmId);
  const voteByUser: Record<string, VoteValue | undefined> = Object.fromEntries(
    votesForFocusedDay.map((v) => [v.userId, v.value]),
  );

  return (
    <aside className="flex flex-col gap-4 p-4 sm:p-5">
      {dm && (
        <div className="flex items-start gap-3 rounded-card border border-dm-gold/40 bg-dm-gold/10 p-3">
          <Avatar src={dm.user.avatarUrl} alt={dm.user.characterName} size={56} ring="gold" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-ink leading-tight truncate">
              {dm.user.characterName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-display tracking-wider uppercase text-dm-gold">
              <Crown className="h-3.5 w-3.5" /> Dungeon Master
            </p>
            <p className="mt-1.5 text-xs italic text-ink-soft leading-snug">
              {dmNote(votesForFocusedDay, dmId)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <p className="small-caps">
          The Party {focusedDate ? `· Votes for ${focusedDate}` : ""}
        </p>
      </div>

      <ul className="space-y-1.5">
        {party.map((m) => {
          const v = voteByUser[m.userId];
          return (
            <li
              key={m.userId}
              className={cn(
                "flex items-center gap-3 rounded-md border border-hairline/50 bg-surface/60 px-2.5 py-2",
              )}
            >
              <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink leading-tight">{m.user.characterName}</p>
                <p className="truncate text-[11px] text-ink-soft">{m.user.displayName}</p>
              </div>
              <VoteChip value={v ?? null} />
            </li>
          );
        })}
      </ul>

      <div className="pt-2">
        <Legend />
      </div>
    </aside>
  );
}
