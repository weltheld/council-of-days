"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import {
  buildMonthGrid,
  defaultMonth,
  monthLabel,
  nextMonth,
  prevMonth,
} from "@/lib/calendar";
import type { Vote, VoteValue } from "@/lib/types";
import type { User, Member } from "@/lib/types";
import { DayCell } from "./DayCell";
import { initialFor } from "@/lib/store";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Props = {
  slug: string;
  dmId: string;
  myUserId: string | null;
  members: (Member & { user: User })[];
  votes: Vote[];
  focusedDate: string | null;
  onVote: (date: string, value: VoteValue | null) => void;
};

export function CalendarPanel({
  slug,
  dmId,
  myUserId,
  members,
  votes,
  focusedDate,
  onVote,
}: Props) {
  const initial = defaultMonth();
  const [{ year, monthIndex }, setMonth] = useState(initial);

  const days = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const monthVotes = useMemo(() => {
    const byDate: Record<string, Vote[]> = {};
    for (const d of days) byDate[d.iso] = [];
    for (const v of votes) if (byDate[v.date]) byDate[v.date].push(v);
    return byDate;
  }, [days, votes]);

  const initialsByUser = useMemo(() => {
    const out: Record<string, string> = {};
    for (const m of members) out[m.userId] = initialFor(m.user);
    return out;
  }, [members]);

  // Best day = most "yes" votes among days where the DM has voted yes.
  const bestDayIso = useMemo(() => {
    let best: { iso: string; yes: number } | null = null;
    for (const d of days) {
      if (!d.inCurrentMonth) continue;
      const dayVotes = monthVotes[d.iso] ?? [];
      const dmYes = dayVotes.some((v) => v.userId === dmId && v.value === "yes");
      if (!dmYes) continue;
      const yes = dayVotes.filter((v) => v.value === "yes").length;
      if (!best || yes > best.yes) best = { iso: d.iso, yes };
    }
    return best?.iso ?? null;
  }, [days, monthVotes, dmId]);

  const dmFreeCount = useMemo(
    () =>
      days.filter(
        (d) =>
          d.inCurrentMonth &&
          (monthVotes[d.iso] ?? []).some((v) => v.userId === dmId && v.value === "yes"),
      ).length,
    [days, monthVotes, dmId],
  );

  return (
    <section className="flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Previous month"
          onClick={() => setMonth(prevMonth(year, monthIndex))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface/70 hover:bg-parchment"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display text-xl sm:text-2xl text-ink">
          {monthLabel(year, monthIndex)}
        </h2>
        <button
          aria-label="Next month"
          onClick={() => setMonth(nextMonth(year, monthIndex))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface/70 hover:bg-parchment"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 text-xs text-dm-gold sm:flex">
          <Crown className="h-3.5 w-3.5" />
          <span className="font-display tracking-wider uppercase">
            DM free · {dmFreeCount}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Tap <span className="text-vote-yes">✓</span> <span className="text-vote-maybe">~</span> <span className="text-vote-no">✗</span> on a day to cast your vote.
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center small-caps">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid flex-1 grid-cols-7 grid-rows-6 gap-1">
        {days.map((d) => (
          <DayCell
            key={d.iso}
            day={d}
            votes={monthVotes[d.iso] ?? []}
            myUserId={myUserId}
            dmId={dmId}
            isBestDay={bestDayIso === d.iso}
            focused={focusedDate === d.iso}
            initialsByUser={initialsByUser}
            slug={slug}
            onVote={onVote}
          />
        ))}
      </div>
    </section>
  );
}
