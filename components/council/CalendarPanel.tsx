"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import {
  buildMonthGrid,
  defaultMonth,
  monthLabel,
  nextMonth,
  prevMonth,
} from "@/lib/calendar";
import type { CalendarDay } from "@/lib/calendar";
import type { Vote, VoteValue, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Props = {
  dmUserIds: string[];
  myUserId: string | null;
  nameByUserId: Record<string, string>;
  votes: Vote[];
  viableWeekdays: Weekday[];
  onCycleDay: (date: string, currentValue: VoteValue | undefined) => void;
  /** Optional callback so the parent can also know the best day (for the sidebar). */
  onBestDayChange?: (iso: string | null) => void;
  /** Expose current month days so parent can render QuickFillBar externally. */
  onDaysChange?: (days: CalendarDay[]) => void;
  onMonthChange?: (year: number, monthIndex: number) => void;
  initialMonth?: { year: number; monthIndex: number };
  isCreator?: boolean;
  onOpenSettings?: () => void;
  /** Optional content rendered directly below the month header (e.g. quick fill on mobile). */
  belowHeader?: React.ReactNode;
  /** ISO dates marked as game sessions. */
  sessionDates?: Set<string>;
  /** Creator-only: toggle a date's session mark. */
  onToggleSession?: (iso: string) => void;
  /** date → names of OTHER campaigns with a play-date that day. */
  conflictByDate?: Map<string, string[]>;
  /** date → the user's votes in OTHER campaigns. */
  alignByDate?: Map<string, { value: VoteValue; campaignName: string }[]>;
  /** Whether the align overlay is active. */
  showAlign?: boolean;
  /** When false, hide the group vote tallies (show only the user's own tint). */
  showTallies?: boolean;
};

export function CalendarPanel({
  dmUserIds,
  myUserId,
  nameByUserId,
  votes,
  viableWeekdays,
  onCycleDay,
  onBestDayChange,
  onDaysChange,
  onMonthChange,
  initialMonth,
  isCreator,
  onOpenSettings,
  belowHeader,
  sessionDates,
  onToggleSession,
  conflictByDate,
  alignByDate,
  showAlign,
  showTallies = true,
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
      const dmsFree =
        dmUserIds.length > 0 &&
        dmUserIds.every((id) =>
          dayVotes.some((v) => v.userId === id && v.value === "yes"),
        );
      if (!dmsFree) continue;
      const yes = dayVotes.filter((v) => v.value === "yes").length;
      if (!best || yes > best.yes) best = { iso: d.iso, yes };
    }
    return best?.iso ?? null;
  }, [days, monthVotes, dmUserIds, viableSet]);

  // Surface best-day and current days to parent.
  const lastReportedRef = useMemo(() => ({ bestDay: null as string | null, days: null as CalendarDay[] | null }), []);
  if (onBestDayChange && lastReportedRef.bestDay !== bestDayIso) {
    lastReportedRef.bestDay = bestDayIso;
    queueMicrotask(() => onBestDayChange(bestDayIso));
  }
  if (onDaysChange && lastReportedRef.days !== days) {
    lastReportedRef.days = days;
    queueMicrotask(() => onDaysChange(days));
  }

  // Direction of the last month change, so the grid can animate in from the
  // correct side. Bumped on every change to retrigger the CSS animation.
  const [transition, setTransition] = useState<{ dir: -1 | 1; n: number }>({
    dir: 1,
    n: 0,
  });

  function go(delta: -1 | 1) {
    const m = delta === -1 ? prevMonth(year, monthIndex) : nextMonth(year, monthIndex);
    setMonth(m);
    setTransition((t) => ({ dir: delta, n: t.n + 1 }));
    onMonthChange?.(m.year, m.monthIndex);
  }

  // Horizontal swipe to switch months (mobile). We only act on a clearly
  // horizontal gesture so vertical scrolling is never hijacked.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? 1 : -1); // swipe left → next, swipe right → previous
  }

  return (
    <section className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-2 lg:gap-4">
        <button
          aria-label="Previous month"
          onClick={() => go(-1)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface shadow-sm hover:bg-parchment lg:h-9 lg:w-9"
        >
          <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </button>
        <h2 className="flex-1 text-center font-display text-xl text-ink lg:flex-none lg:text-left lg:text-2xl">
          {monthLabel(year, monthIndex)}
        </h2>
        <button
          aria-label="Next month"
          onClick={() => go(1)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface shadow-sm hover:bg-parchment lg:h-9 lg:w-9"
        >
          <ChevronRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </button>
        {/* Spacer + Poll settings only from lg up; on mobile the banner
            carries the settings icon. */}
        <div className="hidden flex-1 lg:block" />
        {isCreator && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-body font-bold text-ink-soft shadow-sm hover:bg-parchment hover:text-ink lg:inline-flex"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Poll settings
          </button>
        )}
      </div>

      {belowHeader}

      <div className="grid grid-cols-7 gap-1 text-center small-caps">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div
        key={transition.n}
        className={cn(
          "grid flex-1 grid-cols-7 auto-rows-fr gap-1 touch-pan-y select-none",
          transition.n > 0 &&
            (transition.dir === 1 ? "animate-month-next" : "animate-month-prev"),
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {days.map((d) => (
          <DayCell
            key={d.iso}
            day={d}
            votes={monthVotes[d.iso] ?? []}
            myUserId={myUserId}
            dmUserIds={dmUserIds}
            nameByUserId={nameByUserId}
            isBestDay={bestDayIso === d.iso}
            isViableWeekday={viableSet.has(d.weekday as Weekday)}
            isSession={sessionDates?.has(d.iso) ?? false}
            isCreator={isCreator}
            onToggleSession={onToggleSession}
            conflictCampaigns={conflictByDate?.get(d.iso)}
            alignVotes={showAlign ? alignByDate?.get(d.iso) : undefined}
            showTallies={showTallies}
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
