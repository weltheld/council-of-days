"use client";

import { VenetianMask } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar";
import type { Vote, VoteValue } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  day: CalendarDay;
  votes: Vote[];
  myUserId: string | null;
  dmUserIds: string[];
  isBestDay: boolean;
  isViableWeekday: boolean;
  /** userId → character name, for the hover tooltip. */
  nameByUserId: Record<string, string>;
  onCycle: (date: string) => void;
};

export function nextVoteValue(current: VoteValue | undefined): VoteValue | null {
  if (current === "yes") return "maybe";
  if (current === "maybe") return "no";
  if (current === "no") return null;
  return "yes";
}

export function DayCell({
  day,
  votes,
  myUserId,
  dmUserIds,
  isBestDay,
  isViableWeekday,
  nameByUserId,
  onCycle,
}: Props) {
  const namesFor = (value: VoteValue) =>
    votes
      .filter((v) => v.value === value)
      .map((v) => nameByUserId[v.userId] ?? "Someone");
  const tooltipGroups: { label: string; names: string[] }[] = [
    { label: "Yes", names: namesFor("yes") },
    { label: "Maybe", names: namesFor("maybe") },
    { label: "No", names: namesFor("no") },
  ].filter((g) => g.names.length > 0);
  const myVote = myUserId
    ? (votes.find((v) => v.userId === myUserId)?.value as VoteValue | undefined)
    : undefined;
  const dmFree =
    dmUserIds.length > 0 &&
    dmUserIds.every((id) =>
      votes.some((v) => v.userId === id && v.value === "yes"),
    );

  const yesCount = votes.filter((v) => v.value === "yes").length;
  const maybeCount = votes.filter((v) => v.value === "maybe").length;
  const noCount = votes.filter((v) => v.value === "no").length;

  const interactive =
    day.inCurrentMonth && isViableWeekday && !day.isPast && !!myUserId;

  // Tinted background derived from user's own vote. Solid (opaque) beige
  // blends so the tile keeps its parchment color and just gains a subtle
  // green/yellow/red tint — never going transparent.
  const bgTint = !day.inCurrentMonth
    ? "bg-transparent"
    : !isViableWeekday
      ? "bg-[#E7DECB]"
      : myVote === "yes"
        ? "bg-[#D5D9C4]"
        : myVote === "no"
          ? "bg-[#E8D2C5]"
          : myVote === "maybe"
            ? "bg-[#EDE0BE]"
            : "bg-surface";

  return (
    <div className="group relative h-full">
    <button
      type="button"
      onClick={() => interactive && onCycle(day.iso)}
      disabled={!interactive}
      className={cn(
        "relative flex h-full min-h-[78px] w-full flex-col rounded-md border p-1.5 text-left transition",
        bgTint,
        day.inCurrentMonth ? "border-hairline/70" : "border-transparent opacity-40",
        !isViableWeekday && day.inCurrentMonth && "cursor-not-allowed",
        day.isPast && day.inCurrentMonth && "cursor-not-allowed opacity-55",
        interactive && "hover:border-ink/40 cursor-pointer",
        isBestDay && "border-dm-gold/80 ring-1 ring-dm-gold/40",
      )}
      aria-label={
        interactive
          ? `Cycle vote for ${day.iso}, currently ${myVote ?? "none"}`
          : day.iso
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-baseline gap-1">
          <span
            className={cn(
              "font-display text-sm leading-none",
              day.isToday && "text-wine font-bold",
              !isViableWeekday && day.inCurrentMonth && "text-ink-soft/40",
            )}
          >
            {day.dayOfMonth}
          </span>
          {day.isToday && (
            <span className="text-[8px] font-display tracking-wider uppercase text-wine">
              Today
            </span>
          )}
          {isBestDay && (
            <span className="ml-1 hidden rounded-sm bg-dm-gold px-1 py-0.5 text-[9px] font-display tracking-wider uppercase text-parchment shadow-sm sm:inline-block">
              Best day
            </span>
          )}
        </div>
        {dmFree && day.inCurrentMonth && (
          <span
            title="The Dungeon Master is available this day"
            aria-label="The Dungeon Master is available this day"
            className="inline-flex"
          >
            <VenetianMask className="h-3 w-3 text-dm-gold" />
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-1 pt-1.5">
        <div className="flex items-center gap-1.5">
          {yesCount > 0 && (
            <span className="flex items-center gap-0.5 text-vote-yes">
              <span className="h-1.5 w-1.5 rounded-full bg-vote-yes" />
              <span className="font-display text-xs leading-none">{yesCount}</span>
            </span>
          )}
          {maybeCount > 0 && (
            <span className="flex items-center gap-0.5 text-vote-maybe">
              <span className="h-1.5 w-1.5 rounded-full bg-vote-maybe" />
              <span className="font-display text-xs leading-none">{maybeCount}</span>
            </span>
          )}
          {noCount > 0 && (
            <span className="flex items-center gap-0.5 text-vote-no">
              <span className="h-1.5 w-1.5 rounded-full bg-vote-no" />
              <span className="font-display text-xs leading-none">{noCount}</span>
            </span>
          )}
        </div>

        {day.inCurrentMonth && <VoteControl value={myVote} />}
      </div>
    </button>

      {day.inCurrentMonth && tooltipGroups.length > 0 && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md border border-ink/20 bg-ink px-3 py-2 text-left text-parchment shadow-lg group-hover:block">
          {tooltipGroups.map((g) => (
            <div key={g.label} className="text-[11px] leading-snug">
              <span className="font-display tracking-wider uppercase text-dm-gold">
                {g.label}:
              </span>{" "}
              {g.names.join(", ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoteControl({ value }: { value: VoteValue | undefined }) {
  if (!value) {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-ink-soft/40 bg-surface/60"
        aria-hidden
      >
        <span className="h-1 w-1 rounded-full bg-ink-soft/60" />
      </span>
    );
  }
  const cls =
    value === "yes" ? "bg-vote-yes" : value === "maybe" ? "bg-vote-maybe" : "bg-vote-no";
  const glyph = value === "yes" ? "✓" : value === "maybe" ? "~" : "✗";
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-display text-[11px] text-parchment shadow-sm",
        cls,
      )}
    >
      {glyph}
    </span>
  );
}
