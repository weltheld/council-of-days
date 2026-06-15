"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import type { VoteValue, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_CHIPS: { label: string; value: Weekday }[] = [
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
  { label: "Su", value: 0 },
];

type Props = {
  viableWeekdays: Weekday[];
  onApply: (weekdays: Weekday[], value: VoteValue) => void;
  className?: string;
};

export function QuickFillBar({ viableWeekdays, onApply, className }: Props) {
  const [selected, setSelected] = useState<Set<Weekday>>(new Set());
  const viable = new Set(viableWeekdays);

  function toggle(w: Weekday) {
    if (!viable.has(w)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  }

  function apply(value: VoteValue) {
    if (selected.size === 0) return;
    onApply(Array.from(selected), value);
    setSelected(new Set());
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border border-hairline/70 bg-surface/70 px-3 py-2.5",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-gold">
        <Wand2 className="h-3.5 w-3.5" />
        <span className="small-caps">Quick fill</span>
      </span>

      <span className="hidden h-5 w-px bg-hairline sm:inline-block" />

      <div className="flex flex-wrap items-center gap-1">
        {DAY_CHIPS.map(({ label, value }) => {
          const isOn = selected.has(value);
          const isViable = viable.has(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              disabled={!isViable}
              className={cn(
                "h-7 w-9 rounded-md border text-xs font-display tracking-wider uppercase transition",
                isOn
                  ? "bg-wine text-parchment border-wine"
                  : isViable
                    ? "border-hairline bg-surface text-ink-soft hover:bg-parchment"
                    : "border-transparent text-ink-soft/40 cursor-not-allowed",
              )}
              aria-pressed={isOn}
              aria-label={`Toggle ${label}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <span className="hidden h-5 w-px bg-hairline sm:inline-block" />

      <div className="flex items-center gap-1.5">
        <FillButton color="vote-yes" glyph="Yes" onClick={() => apply("yes")} disabled={!selected.size} />
        <FillButton color="vote-maybe" glyph="Maybe" onClick={() => apply("maybe")} disabled={!selected.size} />
        <FillButton color="vote-no" glyph="No" onClick={() => apply("no")} disabled={!selected.size} />
      </div>
    </div>
  );
}

function FillButton({
  color,
  glyph,
  onClick,
  disabled,
}: {
  color: "vote-yes" | "vote-maybe" | "vote-no";
  glyph: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-display tracking-wider uppercase transition",
        color === "vote-yes" && "text-vote-yes border-vote-yes/40 hover:bg-vote-yes/10",
        color === "vote-maybe" && "text-vote-maybe border-vote-maybe/40 hover:bg-vote-maybe/10",
        color === "vote-no" && "text-vote-no border-vote-no/40 hover:bg-vote-no/10",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-${color}`)} />
      {glyph}
    </button>
  );
}
