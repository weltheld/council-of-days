"use client";

import { Crown } from "lucide-react";
import { Avatar } from "./Avatar";
import { VoteChip } from "./VoteChip";
import type { Member, User, Vote, VoteValue } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type MemberWithUser = Member & { user: User };

type Props = {
  members: MemberWithUser[];
  dmId: string;
  myUserId: string | null;
  /** The leading day (best day) — drives the per-member chip column. */
  leadingDayIso: string | null;
  /** All votes for the campaign (we filter for the leading day inside). */
  votes: Vote[];
};

function isoToWeekdayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return format(new Date(y, m - 1, d), "EEE, MMM d").toUpperCase();
}

function dmNote(dmVoteOnLeading: VoteValue | undefined) {
  if (dmVoteOnLeading === "yes") return "She is in — the table can convene.";
  if (dmVoteOnLeading === "maybe") return "She may join — keep the seat warm.";
  if (dmVoteOnLeading === "no") return "She is out — choose another day.";
  return "Her days rule the calendar";
}

export function RosterPanel({
  members,
  dmId,
  myUserId,
  leadingDayIso,
  votes,
}: Props) {
  const dm = members.find((m) => m.userId === dmId);
  const party = members.filter((m) => m.userId !== dmId);
  const leadingVotes = leadingDayIso
    ? votes.filter((v) => v.date === leadingDayIso)
    : [];
  const voteByUser: Record<string, VoteValue | undefined> = Object.fromEntries(
    leadingVotes.map((v) => [v.userId, v.value]),
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
              {dmNote(voteByUser[dmId])}
            </p>
          </div>
        </div>
      )}

      <p className="small-caps">
        The Party{" "}
        {leadingDayIso ? `· Votes for ${isoToWeekdayLabel(leadingDayIso)}` : ""}
      </p>

      <ul className="space-y-1.5">
        {party.map((m) => {
          const v = voteByUser[m.userId];
          const isMe = myUserId === m.userId;
          return (
            <li
              key={m.userId}
              className={cn(
                "flex items-center gap-3 rounded-md border border-hairline/60 bg-surface px-2.5 py-2 shadow-sm",
              )}
            >
              <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink leading-tight">
                  {m.user.characterName}
                </p>
                <p className="truncate text-[11px] text-ink-soft">
                  {m.user.displayName}
                  {isMe && " — you"}
                </p>
              </div>
              <VoteChip value={v ?? null} />
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
