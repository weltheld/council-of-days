"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
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
  { label: "Tavern", value: "tavern", swatch: "bg-[#E7DFCE]" },
  { label: "Parchment", value: "parchment", swatch: "bg-parchment" },
  { label: "Wine", value: "wine", swatch: "bg-[#ECDDDB]" },
  { label: "Forest", value: "forest", swatch: "bg-[#E0E7DD]" },
];

type Props = {
  dmName: string;
  viableWeekdays: Weekday[];
  background: BackgroundScene;
  bannerUrl?: string;
  onToggleWeekday: (w: Weekday) => void;
  onChangeBackground: (bg: BackgroundScene) => void;
  onUploadBanner: (file: File) => Promise<void>;
  onRemoveBanner: () => void;
  onClose: () => void;
  /** If true, no body padding is applied (use when embedded in sheet that already pads). */
  embedded?: boolean;
};

export function OwnerSettings({
  dmName,
  viableWeekdays,
  background,
  bannerUrl,
  onToggleWeekday,
  onChangeBackground,
  onUploadBanner,
  onRemoveBanner,
  onClose,
  embedded = false,
}: Props) {
  const viable = new Set(viableWeekdays);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      await onUploadBanner(file);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  }

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
        <p className="small-caps">Campaign Banner</p>
        <div className="mt-2">
          {bannerUrl ? (
            <div className="overflow-hidden rounded-md border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt="Campaign banner"
                className="h-24 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-hairline bg-surface/60 text-xs text-ink-soft">
              No banner yet
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickBanner}
          />

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-3 py-1.5 text-xs font-display tracking-wider uppercase text-ink hover:bg-parchment disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : bannerUrl ? "Replace" : "Upload"}
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={onRemoveBanner}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-3 py-1.5 text-xs font-display tracking-wider uppercase text-vote-no hover:bg-parchment disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          {uploadError && (
            <p className="mt-2 text-xs text-vote-no">{uploadError}</p>
          )}
          <p className="mt-2 text-xs text-ink-soft">
            Shown across the top of the campaign calendar. Wide images
            (about 1600&times;400) look best.
          </p>
        </div>
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
          Sets the calm background tint behind every player&apos;s calendar.
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
