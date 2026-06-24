"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, Swords, VenetianMask, X } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar";
import type { Vote, VoteValue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WaxSeal } from "./WaxSeal";

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
  /** Whether this date is marked as a game session. */
  isSession?: boolean;
  /** Creator can stamp / unstamp session days. */
  isCreator?: boolean;
  onToggleSession?: (iso: string) => void;
  /** Names of OTHER campaigns with a play-date on this day (the user is booked). */
  conflictCampaigns?: string[];
  /** The user's votes in OTHER campaigns (only when the align overlay is on). */
  alignVotes?: { value: VoteValue; campaignName: string }[];
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
  isSession = false,
  isCreator = false,
  onToggleSession,
  conflictCampaigns,
  alignVotes,
}: Props) {
  const hasConflict = !!conflictCampaigns?.length;
  const hasAlign = !!alignVotes?.length;
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

  // `big` marks a long-press (touch) tooltip: larger, and anchored above the
  // finger so it isn't hidden by the hand.
  const [cursor, setCursor] = useState<
    { x: number; y: number; big?: boolean } | null
  >(null);

  // Long-press handling for touch. A press that lasts ~450ms without moving
  // reveals the tooltip and suppresses the vote tap that would otherwise fire
  // on release.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchOrigin.current = { x: t.clientX, y: t.clientY };
    longPressed.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      const o = touchOrigin.current;
      if (o) setCursor({ x: o.x, y: o.y, big: true });
    }, 450);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const o = touchOrigin.current;
    if (!o) return;
    const t = e.touches[0];
    // A real drag (e.g. month swipe / scroll) cancels the long-press.
    if (Math.abs(t.clientX - o.x) > 10 || Math.abs(t.clientY - o.y) > 10) {
      clearLongPress();
      if (longPressed.current) setCursor(null);
      longPressed.current = false;
      touchOrigin.current = null;
    }
  }

  function handleTouchEnd() {
    clearLongPress();
    touchOrigin.current = null;
    setCursor(null);
  }

  // Long-press (touch) tooltips are bigger and sit above the finger; mouse
  // tooltips keep their original compact size next to the cursor.
  const big = !!cursor?.big;
  const tipText = big ? "text-[14px]" : "text-[11px]";
  const tipDot = big ? "h-2 w-2" : "h-1.5 w-1.5";
  const tipIcon = big ? "h-4 w-4" : "h-3 w-3";

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
    <button
      type="button"
      onClick={() => {
        // A long-press already showed the tooltip — don't also cycle the vote.
        if (longPressed.current) {
          longPressed.current = false;
          return;
        }
        interactive && onCycle(day.iso);
      }}
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
        {day.inCurrentMonth && (hasAlign || hasConflict || dmFree) && (
          <div className="flex items-center gap-1">
            {hasAlign && (
              <span className="inline-flex items-center gap-0.5">
                {alignVotes!.slice(0, 3).map((av, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full ring-1 ring-white/70",
                      av.value === "yes"
                        ? "bg-vote-yes"
                        : av.value === "maybe"
                          ? "bg-vote-maybe"
                          : "bg-vote-no",
                    )}
                  />
                ))}
              </span>
            )}
            {hasConflict && (
              <span className="inline-flex" aria-label="Booked in another campaign">
                <Swords className="h-3 w-3 text-wine" />
              </span>
            )}
            {dmFree && (
              <span
                aria-label="The Dungeon Master is available this day"
                className="inline-flex"
              >
                <VenetianMask className="h-3 w-3 text-dm-gold" />
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-auto flex flex-wrap gap-1 pt-1.5",
          isSession && "pr-7",
        )}
      >
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

      {/* Session crest medallion. Owners can click it to remove the session
          (an × fades in over the coin on hover); everyone else just sees it. */}
      {isSession && day.inCurrentMonth &&
        (isCreator && onToggleSession ? (
          <button
            type="button"
            onClick={() => onToggleSession(day.iso)}
            className="group/seal absolute bottom-1 right-1 z-20 inline-flex items-center justify-center rounded-full"
            aria-label={`Remove game session on ${day.iso}`}
            title="Click to remove this session"
          >
            <WaxSeal played={day.isPast} />
            <span className="pointer-events-none absolute inset-[4px] inline-flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover/seal:opacity-100">
              <X className="h-3.5 w-3.5 text-white" strokeWidth={2.75} />
            </span>
          </button>
        ) : (
          <div className="pointer-events-none absolute bottom-1 right-1 z-10">
            <WaxSeal played={day.isPast} />
          </div>
        ))}

      {/* Owner control: stamp a new session (faint seal + on hover) */}
      {isCreator && onToggleSession && !isSession && day.inCurrentMonth && (
        <button
          type="button"
          onClick={() => onToggleSession(day.iso)}
          className="absolute bottom-1 right-1 z-20 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-dashed border-dm-gold/70 bg-dm-gold/15 text-dm-gold opacity-0 transition hover:bg-dm-gold/25 group-hover:opacity-100"
          aria-label={`Mark ${day.iso} as a game session`}
          title="Mark as game session"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      {day.inCurrentMonth &&
        cursor &&
        (hasConflict || hasAlign || (isViableWeekday && tooltipRows.length > 0)) && (
          <div
            className={cn(
              "pointer-events-none fixed z-50 w-max rounded-md border border-hairline bg-surface text-left shadow-parchment",
              big ? "max-w-[280px] px-4 py-3" : "max-w-[220px] px-3 py-2",
            )}
            style={
              big
                ? {
                    left: cursor.x,
                    top: cursor.y - 28,
                    transform: "translate(-50%, -100%)",
                  }
                : { left: cursor.x + 14, top: cursor.y + 14 }
            }
          >
            {hasConflict && (
              <div className="mb-1">
                <div className={cn("flex items-center gap-1 font-bold text-wine", tipText)}>
                  <Swords className={tipIcon} />
                  Booked elsewhere
                </div>
                {conflictCampaigns!.map((c) => (
                  <div key={c} className={cn("pl-4 leading-snug text-ink-soft", tipText)}>
                    {c}
                  </div>
                ))}
              </div>
            )}

            {hasAlign && (
              <div className={cn("mb-1", hasConflict && "border-t border-hairline pt-1")}>
                <div className={cn("font-bold text-ink", tipText)}>Your other campaigns</div>
                {alignVotes!.map((av, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-1.5 leading-snug",
                      tipText,
                      voteColor(av.value),
                    )}
                  >
                    <span
                      className={cn(
                        tipDot,
                        "shrink-0 rounded-full",
                        av.value === "yes"
                          ? "bg-vote-yes"
                          : av.value === "maybe"
                            ? "bg-vote-maybe"
                            : "bg-vote-no",
                      )}
                    />
                    {av.campaignName} · {av.value}
                  </div>
                ))}
              </div>
            )}

            {isViableWeekday && tooltipRows.length > 0 && (
              <div
                className={cn(
                  (hasConflict || hasAlign) && "border-t border-hairline pt-1",
                )}
              >
                {tooltipRows.map((r) => (
                  <div
                    key={r.name}
                    className={cn(
                      "flex items-center gap-1.5 leading-snug",
                      tipText,
                      voteColor(r.value),
                    )}
                  >
                    <span
                      className={cn(
                        tipDot,
                        "shrink-0 rounded-full",
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
        )}
    </div>
  );
}
