"use client";

import { useState } from "react";
import { Check, Minus, VenetianMask, X } from "lucide-react";
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
  // Tooltip: every member, name coloured by their vote; non-voters greyed.
  const voteByUserId = new Map(votes.map((v) => [v.userId, v.value]));
  const rank: Record<string, number> = { yes: 0, maybe: 1, no: 2 };
  const tooltipRows = Object.entries(nameByUserId)
    .map(([id, name]) => ({ name, value: voteByUserId.get(id) }))
    .sort(
      (a, b) =>
        (a.value ? rank[a.value] : 3) - (b.value ? rank[b.value] : 3),
    );
  const voteColor = (value: VoteValue | undefined) =>
    value === "yes"
      ? "text-vote-yes"
      : value === "maybe"
        ? "text-vote-maybe"
        : value === "no"
          ? "text-vote-no"
          : "text-ink-soft/45";
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

  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

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
    <div
      className="group relative h-full"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setCursor(null)}
    >
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

      <div className="mt-auto flex flex-wrap gap-1 pt-1.5">
        {yesCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-display text-[10px] font-bold leading-none" style={{background:"#c8d8c0",color:"#1e3a28"}}>
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            {yesCount}
          </span>
        )}
        {maybeCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-display text-[10px] font-bold leading-none" style={{background:"#e8d8a8",color:"#5a4010"}}>
            <Minus className="h-2.5 w-2.5" strokeWidth={3} />
            {maybeCount}
          </span>
        )}
        {noCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-display text-[10px] font-bold leading-none" style={{background:"#e8c0c0",color:"#5a1820"}}>
            <X className="h-2.5 w-2.5" strokeWidth={3} />
            {noCount}
          </span>
        )}
      </div>
    </button>

      {day.inCurrentMonth && isViableWeekday && tooltipRows.length > 0 && cursor && (
        <div
          className="pointer-events-none fixed z-50 w-max max-w-[220px] rounded-md border border-hairline bg-surface px-3 py-2 text-left shadow-parchment"
          style={{ left: cursor.x + 14, top: cursor.y + 14 }}
        >
          {tooltipRows.map((r) => (
            <div
              key={r.name}
              className={cn(
                "flex items-center gap-1.5 text-[11px] leading-snug",
                voteColor(r.value),
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  r.value === "yes"
                    ? "bg-vote-yes"
                    : r.value === "maybe"
                      ? "bg-vote-maybe"
                      : r.value === "no"
                        ? "bg-vote-no"
                        : "bg-ink-soft/40",
                )}
              />
              {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
