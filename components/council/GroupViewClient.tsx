"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/council/TopBar";
import { RosterPanel } from "@/components/council/RosterPanel";
import { CalendarPanel } from "@/components/council/CalendarPanel";
import { OwnerSettings } from "@/components/council/OwnerSettings";
import { BestDaySummary } from "@/components/council/BestDaySummary";
import type {
  BackgroundScene,
  Group,
  Member,
  User,
  Vote,
  VoteValue,
  Weekday,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { uploadBannerAction } from "@/app/g/[slug]/bannerActions";

type MemberWithUser = Member & { user: User };

type Props = {
  group: Group;
  members: MemberWithUser[];
  votes: Vote[];
  currentUser: User;
};

export function GroupViewClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState(props.group);
  const [votes, setVotes] = useState<Vote[]>(props.votes);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bestDayIso, setBestDayIso] = useState<string | null>(null);

  // Keep local state in sync if the server re-renders with new props
  // (e.g. after router.refresh()).
  useEffect(() => setGroup(props.group), [props.group]);
  useEffect(() => setVotes(props.votes), [props.votes]);

  const supabase = getBrowserSupabase();
  const isCreator = currentUserMatches(props.currentUser.id, group.creatorId);

  // Deep link from the home card's "Edit" button opens Poll Settings.
  useEffect(() => {
    if (isCreator && searchParams.get("settings") === "open") {
      setSettingsOpen(true);
    }
  }, [isCreator, searchParams]);
  const subtitle = "";

  const dm = props.members.find((m) => m.userId === group.dmId);
  const leadingVotes = bestDayIso
    ? votes.filter((v) => v.date === bestDayIso)
    : [];
  const participantCount = props.members.filter(
    (m) => m.userId !== group.dmId,
  ).length;
  const leadingYesExclDm = leadingVotes.filter(
    (v) => v.value === "yes" && v.userId !== group.dmId,
  ).length;

  const handleCycle = useCallback(
    async (date: string, current: VoteValue | undefined) => {
      const next: VoteValue | null =
        current === "yes"
          ? "maybe"
          : current === "maybe"
            ? "no"
            : current === "no"
              ? null
              : "yes";

      // Optimistic update.
      setVotes((prev) => {
        const without = prev.filter(
          (v) =>
            !(
              v.groupId === group.id &&
              v.userId === props.currentUser.id &&
              v.date === date
            ),
        );
        return next === null
          ? without
          : [...without, { groupId: group.id, userId: props.currentUser.id, date, value: next }];
      });

      if (next === null) {
        await supabase
          .from("votes")
          .delete()
          .eq("campaign_id", group.id)
          .eq("user_id", props.currentUser.id)
          .eq("date", date);
      } else {
        await supabase.from("votes").upsert(
          {
            campaign_id: group.id,
            user_id: props.currentUser.id,
            date,
            value: next,
          },
          { onConflict: "campaign_id,user_id,date" },
        );
      }
    },
    [supabase, group.id, props.currentUser.id],
  );

  const handleBulkFill = useCallback(
    async (_weekdays: Weekday[], value: VoteValue, isoDates: string[]) => {
      setVotes((prev) => {
        const without = prev.filter(
          (v) =>
            !(
              v.groupId === group.id &&
              v.userId === props.currentUser.id &&
              isoDates.includes(v.date)
            ),
        );
        const added: Vote[] = isoDates.map((date) => ({
          groupId: group.id,
          userId: props.currentUser.id,
          date,
          value,
        }));
        return [...without, ...added];
      });

      if (isoDates.length === 0) return;
      await supabase.from("votes").upsert(
        isoDates.map((date) => ({
          campaign_id: group.id,
          user_id: props.currentUser.id,
          date,
          value,
        })),
        { onConflict: "campaign_id,user_id,date" },
      );
    },
    [supabase, group.id, props.currentUser.id],
  );

  const handleToggleWeekday = useCallback(
    async (w: Weekday) => {
      const next = group.viableWeekdays.includes(w)
        ? group.viableWeekdays.filter((x) => x !== w)
        : ([...group.viableWeekdays, w].sort() as Weekday[]);
      setGroup((g) => ({ ...g, viableWeekdays: next }));
      await supabase
        .from("campaigns")
        .update({ viable_weekdays: next })
        .eq("id", group.id);
    },
    [supabase, group.id, group.viableWeekdays],
  );

  const handleChangeBackground = useCallback(
    async (bg: BackgroundScene) => {
      setGroup((g) => ({ ...g, background: bg }));
      await supabase
        .from("campaigns")
        .update({ background: bg })
        .eq("id", group.id);
    },
    [supabase, group.id],
  );

  const handleUploadBanner = useCallback(
    async (blob: Blob) => {
      const fd = new FormData();
      fd.append("file", blob, "banner.jpg");
      const result = await uploadBannerAction(group.id, fd);
      if (!result.ok) throw new Error(result.error);
      setGroup((g) => ({ ...g, bannerUrl: result.url }));
    },
    [group.id],
  );

  const handleRemoveBanner = useCallback(async () => {
    setGroup((g) => ({ ...g, bannerUrl: undefined }));
    await supabase
      .from("campaigns")
      .update({ banner_url: null })
      .eq("id", group.id);
  }, [supabase, group.id]);

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col",
        `bg-scene-${group.background}`,
      )}
    >
      <div className="relative flex min-h-screen flex-col">
        <TopBar
          groupName={group.name}
          subtitle={subtitle}
          slug={group.slug}
          currentUser={props.currentUser}
          isCreator={isCreator}
          roleLabel={isCreator ? "Creator" : "Player"}
          onOpenSettings={isCreator ? () => setSettingsOpen(true) : undefined}
        />

        {group.bannerUrl && (
          <div className="relative h-40 w-full overflow-hidden border-b border-hairline sm:h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={group.bannerUrl}
              alt={`${group.name} banner`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <main
          className={cn(
            "mx-auto flex w-full max-w-[1440px] flex-1 flex-col",
            settingsOpen
              ? "lg:grid lg:grid-cols-[332px_1fr_300px]"
              : "lg:grid lg:grid-cols-[332px_1fr]",
          )}
        >
          <div className="border-b border-hairline/70 lg:border-b-0 lg:border-r">
            <RosterPanel
              members={props.members}
              dmId={group.dmId}
              myUserId={props.currentUser.id}
              leadingDayIso={bestDayIso}
              votes={votes}
            />
          </div>
          <div className="flex flex-col">
            <CalendarPanel
              dmId={group.dmId}
              myUserId={props.currentUser.id}
              votes={votes}
              viableWeekdays={group.viableWeekdays}
              onCycleDay={handleCycle}
              onBulkFill={(w, value, isoDates) =>
                handleBulkFill(w, value, isoDates)
              }
              onBestDayChange={setBestDayIso}
            />
            <div className="px-4 pb-4 sm:px-5 lg:hidden">
              <BestDaySummary
                bestDayIso={bestDayIso}
                dmName={dm?.user.characterName ?? "The DM"}
                yesCountExcludingDm={leadingYesExclDm}
                participantCountExcludingDm={participantCount}
              />
            </div>
          </div>
          {settingsOpen && isCreator && (
            <aside className="hidden border-l border-hairline/70 bg-parchment/30 lg:block">
              <OwnerSettings
                dmName={dm?.user.characterName ?? "The DM"}
                viableWeekdays={group.viableWeekdays}
                background={group.background}
                bannerUrl={group.bannerUrl}
                onToggleWeekday={handleToggleWeekday}
                onChangeBackground={handleChangeBackground}
                onUploadBanner={handleUploadBanner}
                onRemoveBanner={handleRemoveBanner}
                onClose={() => setSettingsOpen(false)}
              />
            </aside>
          )}
        </main>

        {settingsOpen && isCreator && (
          <MobileSettingsSheet
            onClose={() => setSettingsOpen(false)}
            dmName={dm?.user.characterName ?? "The DM"}
            viableWeekdays={group.viableWeekdays}
            background={group.background}
            bannerUrl={group.bannerUrl}
            onToggleWeekday={handleToggleWeekday}
            onChangeBackground={handleChangeBackground}
            onUploadBanner={handleUploadBanner}
            onRemoveBanner={handleRemoveBanner}
          />
        )}
      </div>

      {/* Hint: when the data model changes via server actions elsewhere
          (e.g. a new member joins), the parent server component re-runs
          via revalidatePath; this client just receives fresh props. */}
      <RefreshOnFocus onFocus={() => router.refresh()} />
    </div>
  );
}

function currentUserMatches(myId: string, creatorId: string) {
  return myId === creatorId;
}

function RefreshOnFocus({ onFocus }: { onFocus: () => void }) {
  useEffect(() => {
    function visibility() {
      if (document.visibilityState === "visible") onFocus();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [onFocus]);
  return null;
}

function MobileSettingsSheet({
  onClose,
  dmName,
  viableWeekdays,
  background,
  bannerUrl,
  onToggleWeekday,
  onChangeBackground,
  onUploadBanner,
  onRemoveBanner,
}: {
  onClose: () => void;
  dmName: string;
  viableWeekdays: Weekday[];
  background: BackgroundScene;
  bannerUrl?: string;
  onToggleWeekday: (w: Weekday) => void;
  onChangeBackground: (bg: BackgroundScene) => void;
  onUploadBanner: (blob: Blob) => Promise<void>;
  onRemoveBanner: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-hairline bg-parchment shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1.5 w-10 rounded-full bg-ink-soft/30" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <OwnerSettings
            dmName={dmName}
            viableWeekdays={viableWeekdays}
            background={background}
            bannerUrl={bannerUrl}
            onToggleWeekday={onToggleWeekday}
            onChangeBackground={onChangeBackground}
            onUploadBanner={onUploadBanner}
            onRemoveBanner={onRemoveBanner}
            onClose={onClose}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
