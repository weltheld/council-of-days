"use client";

import { X } from "lucide-react";
import type { BackgroundScene, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

const BACKGROUNDS: { label: string; value: BackgroundScene; swatch: string }[] = [
  { label: "Tavern", value: "tavern", swatch: "bg-[#3a2516]" },
  { label: "Parchment", value: "parchment", swatch: "bg-parchment" },
  { label: "Wine", value: "wine", swatch: "bg-[#6B2230]" },
  { label: "Forest", value: "forest", swatch: "bg-[#2f4a37]" },
];

type Props = {
  dmName: string;
  viableWeekdays: Weekday[];
  background: BackgroundScene;
  onToggleWeekday: (w: Weekday) => void;
  onChangeBackground: (bg: BackgroundScene) => void;
  onClose: () => void;
  /** If true, no body padding is applied (use when embedded in sheet that already pads). */
  embedded?: boolean;
};

export function OwnerSettings({
  dmName,
  viableWeekdays,
  background,
  onToggleWeekday,
  onChangeBackground,
  onClose,
  embedded = false,
}: Props) {
  const viable = new Set(viableWeekdays);

  return (
    <div className={cn("flex h-full flex-col", !embedded && "p-5")}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-xl text-ink">Poll Settings</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Only {dmName}, the Dungeon Master, can change which weekdays the party may vote on.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-soft hover:bg-parchment hover:text-ink"
          aria-label="Close settings"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="my-4 h-px bg-hairline" />

      <section>
        <p className="small-caps">Viable Weekdays</p>
        <ul className="mt-2 space-y-1">
          {WEEKDAYS.map(({ label, value }) => {
            const on = viable.has(value);
            return (
              <li key={value}>
                <label className="flex cursor-pointer items-center justify-between rounded-md border border-hairline/60 bg-surface/60 px-3 py-2 hover:bg-parchment">
                  <span className="text-sm text-ink">{label}</span>
                  <Switch checked={on} onChange={() => onToggleWeekday(value)} />
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="my-4 h-px bg-hairline" />

      <section>
        <p className="small-caps">Group Background</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {BACKGROUNDS.map(({ label, value, swatch }) => {
            const active = background === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChangeBackground(value)}
                className={cn(
                  "flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm transition",
                  active
                    ? "border-dm-gold bg-dm-gold/10"
                    : "border-hairline bg-surface/60 hover:bg-parchment",
                )}
              >
                <span className={cn("h-5 w-5 rounded-full border border-ink/20", swatch)} />
                <span className="font-display tracking-wider uppercase text-xs">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Sets the parchment scene behind every player&apos;s calendar.
        </p>
      </section>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-6 w-10 items-center rounded-full border transition",
        checked
          ? "bg-vote-yes/80 border-vote-yes"
          : "bg-ink-soft/15 border-hairline",
      )}
    >
      <span
        className={cn(
          "absolute h-4 w-4 rounded-full bg-parchment shadow transition",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}
