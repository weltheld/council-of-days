"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import {
  buildMonthGrid,
  defaultMonth,
  monthLabel,
  nextMonth,
  prevMonth,
} from "@/lib/calendar";
import type { Vote, VoteValue, Weekday } from "@/lib/types";
import { DayCell } from "./DayCell";
import { QuickFillBar } from "./QuickFillBar";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Props = {
  dmId: string;
  myUserId: string | null;
  votes: Vote[];
  viableWeekdays: Weekday[];
  onCycleDay: (date: string, currentValue: VoteValue | undefined) => void;
  onBulkFill: (weekdays: Weekday[], value: VoteValue, isoDates: string[]) => void;
  /** Optional callback so the parent can also know the best day (for the roster). */
  onBestDayChange?: (iso: string | null) => void;
  onMonthChange?: (year: number, monthIndex: number) => void;
  initialMonth?: { year: number; monthIndex: number };
};

export function CalendarPanel({
  dmId,
  myUserId,
  votes,
  viableWeekdays,
  onCycleDay,
  onBulkFill,
  onBestDayChange,
  onMonthChange,
  initialMonth,
}: Props) {
  const start = initialMonth ?? defaultMonth();
  const [{ year, monthIndex }, setMonth] = useState(start);

  const days = useMemo(
    () => buildMonthGrid(year, monthIndex),
    [year, monthIndex],
  );
  const monthVotes = useMemo(() => {
    const byDate: Record<string, Vote[]> = {};
    for (const d of days) byDate[d.iso] = [];
    for (const v of votes) if (byDate[v.date]) byDate[v.date].push(v);
    return byDate;
  }, [days, votes]);

  const viableSet = useMemo(() => new Set(viableWeekdays), [viableWeekdays]);

  const bestDayIso = useMemo(() => {
    let best: { iso: string; yes: number } | null = null;
    for (const d of days) {
      if (!d.inCurrentMonth || !viableSet.has(d.weekday as Weekday)) continue;
      const dayVotes = monthVotes[d.iso] ?? [];
      const dmYes = dayVotes.some((v) => v.userId === dmId && v.value === "yes");
      if (!dmYes) continue;
      const yes = dayVotes.filter((v) => v.value === "yes").length;
      if (!best || yes > best.yes) best = { iso: d.iso, yes };
    }
    return best?.iso ?? null;
  }, [days, monthVotes, dmId, viableSet]);

  // Surface best-day to parent (for roster panel + footer).
  const lastReportedRef = useMemo(() => ({ value: null as string | null }), []);
  if (onBestDayChange && lastReportedRef.value !== bestDayIso) {
    lastReportedRef.value = bestDayIso;
    queueMicrotask(() => onBestDayChange(bestDayIso));
  }

  const dmFreeCount = useMemo(
    () =>
      days.filter(
        (d) =>
          d.inCurrentMonth &&
          viableSet.has(d.weekday as Weekday) &&
          (monthVotes[d.iso] ?? []).some(
            (v) => v.userId === dmId && v.value === "yes",
          ),
      ).length,
    [days, monthVotes, dmId, viableSet],
  );

  function go(delta: -1 | 1) {
    const m = delta === -1 ? prevMonth(year, monthIndex) : nextMonth(year, monthIndex);
    setMonth(m);
    onMonthChange?.(m.year, m.monthIndex);
  }

  function bulkApply(weekdays: Weekday[], value: VoteValue) {
    const set = new Set(weekdays);
    const isoDates = days
      .filter((d) => d.inCurrentMonth && set.has(d.weekday as Weekday))
      .map((d) => d.iso);
    onBulkFill(weekdays, value, isoDates);
  }

  return (
    <section className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Previous month"
          onClick={() => go(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface shadow-sm hover:bg-parchment"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display text-xl sm:text-2xl text-ink">
          {monthLabel(year, monthIndex)}
        </h2>
        <button
          aria-label="Next month"
          onClick={() => go(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface shadow-sm hover:bg-parchment"
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

      <QuickFillBar
        viableWeekdays={viableWeekdays}
        onApply={bulkApply}
      />

      <div className="grid grid-cols-7 gap-1 text-center small-caps">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 auto-rows-fr gap-1">
        {days.map((d) => (
          <DayCell
            key={d.iso}
            day={d}
            votes={monthVotes[d.iso] ?? []}
            myUserId={myUserId}
            dmId={dmId}
            isBestDay={bestDayIso === d.iso}
            isViableWeekday={viableSet.has(d.weekday as Weekday)}
            onCycle={(iso) => {
              const current = (monthVotes[iso] ?? []).find(
                (v) => v.userId === myUserId,
              )?.value as VoteValue | undefined;
              onCycleDay(iso, current);
            }}
          />
        ))}
      </div>
    </section>
  );
}
