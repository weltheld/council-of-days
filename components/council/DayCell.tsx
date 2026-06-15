"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar";
import type { Vote, VoteValue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { voteGlyph, voteTone } from "./VoteChip";

type Props = {
  day: CalendarDay;
  votes: Vote[];
  myUserId: string | null;
  dmId: string;
  isBestDay: boolean;
  focused: boolean;
  initialsByUser: Record<string, string>;
  slug: string;
  onVote: (date: string, value: VoteValue | null) => void;
};

export function DayCell({
  day,
  votes,
  myUserId,
  dmId,
  isBestDay,
  focused,
  initialsByUser,
  slug,
  onVote,
}: Props) {
  const myVote = votes.find((v) => v.userId === myUserId)?.value;
  const dmVote = votes.find((v) => v.userId === dmId)?.value;
  const dmFree = dmVote === "yes";
  const yesVoters = votes.filter((v) => v.value === "yes" && v.userId !== dmId);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-md border bg-surface/70 p-1.5 text-left transition",
        day.inCurrentMonth ? "border-hairline/70" : "border-transparent bg-surface/30 opacity-50",
        focused && "ring-2 ring-gold",
        isBestDay && "border-dm-gold bg-dm-gold/8",
      )}
    >
      {isBestDay && (
        <span className="absolute -top-2 left-1.5 rounded-sm bg-dm-gold px-1.5 py-0.5 text-[9px] font-display tracking-wider uppercase text-parchment shadow-sm">
          Best day
        </span>
      )}
      {dmFree && day.inCurrentMonth && !isBestDay && (
        <Crown
          className="absolute right-1.5 top-1.5 h-3 w-3 text-dm-gold"
          aria-label="DM is free"
        />
      )}

      <Link
        href={`/g/${slug}/d/${day.iso}`}
        scroll={false}
        className="flex items-baseline justify-between"
      >
        <span
          className={cn(
            "font-display text-sm leading-none",
            day.isToday ? "text-wine font-bold" : "text-ink",
          )}
        >
          {day.dayOfMonth}
        </span>
        {day.isToday && (
          <span className="text-[8px] font-display tracking-wider uppercase text-wine">
            Today
          </span>
        )}
      </Link>

      {yesVoters.length > 0 && day.inCurrentMonth && (
        <div className="mt-1 flex flex-wrap items-center gap-0.5">
          {yesVoters.slice(0, 6).map((v) => (
            <span
              key={v.userId}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-vote-yes/15 font-display text-[9px] text-vote-yes"
              title={initialsByUser[v.userId]}
            >
              {initialsByUser[v.userId]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-0.5 pt-1">
        {(["yes", "maybe", "no"] as const).map((value) => {
          const active = myVote === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onVote(day.iso, active ? null : value)}
              disabled={!myUserId || !day.inCurrentMonth}
              aria-label={`Vote ${value} for ${day.iso}`}
              className={cn(
                "inline-flex h-6 flex-1 items-center justify-center rounded-sm border font-display text-sm transition",
                active
                  ? cn(
                      value === "yes" && "border-vote-yes bg-vote-yes/15",
                      value === "maybe" && "border-vote-maybe bg-vote-maybe/15",
                      value === "no" && "border-vote-no bg-vote-no/15",
                    )
                  : "border-hairline/40 bg-transparent hover:bg-parchment/60",
                voteTone[value],
                "disabled:opacity-30",
              )}
            >
              {voteGlyph[value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
