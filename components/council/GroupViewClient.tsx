"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/council/AppHeader";
import { CalendarPanel } from "@/components/council/CalendarPanel";
import { OwnerSettings } from "@/components/council/OwnerSettings";
import { BestDaySummary } from "@/components/council/BestDaySummary";
import { QuickFillBar } from "@/components/council/QuickFillBar";
import { Avatar } from "@/components/council/Avatar";
import type { CalendarDay } from "@/lib/calendar";
import { buildMonthGrid } from "@/lib/calendar";
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
import {
  removeMemberAction,
  setMemberDmAction,
} from "@/app/g/[slug]/roleActions";

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
  const [currentMonthDays, setCurrentMonthDays] = useState<CalendarDay[]>(
    () => { const d = new Date(); return buildMonthGrid(d.getFullYear(), d.getMonth()); }
  );

  // Keep local state in sync if the server re-renders with new props
  // (e.g. after router.refresh()).
  useEffect(() => setGroup(props.group), [props.group]);
  useEffect(() => setVotes(props.votes), [props.votes]);

  const supabase = getBrowserSupabase();
  const isCreator = currentUserMatches(props.currentUser.id, group.creatorId);
  const firstName =
    props.currentUser.displayName?.split(" ")[0] ||
    props.currentUser.characterName ||
    props.currentUser.email?.split("@")[0] ||
    "Adventurer";

  // Deep link from the home card's "Edit" button opens Poll Settings.
  useEffect(() => {
    if (isCreator && searchParams.get("settings") === "open") {
      setSettingsOpen(true);
    }
  }, [isCreator, searchParams]);

  const [members, setMembers] = useState(props.members);
  useEffect(() => setMembers(props.members), [props.members]);

  const dmUserIds = members.filter((m) => m.isDm).map((m) => m.userId);
  const nameByUserId = Object.fromEntries(
    members.map((m) => [
      m.userId,
      m.user.characterName || m.user.displayName || m.user.email,
    ]),
  );
  const leadingVotes = bestDayIso
    ? votes.filter((v) => v.date === bestDayIso)
    : [];
  const leadingYesCount = leadingVotes.filter((v) => v.value === "yes").length;

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

  const handleResetMonth = useCallback(
    async (isoDates: string[]) => {
      if (isoDates.length === 0) return;
      const dateSet = new Set(isoDates);
      setVotes((prev) =>
        prev.filter(
          (v) =>
            !(v.userId === props.currentUser.id && dateSet.has(v.date)),
        ),
      );
      await supabase
        .from("votes")
        .delete()
        .eq("campaign_id", group.id)
        .eq("user_id", props.currentUser.id)
        .in("date", isoDates);
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
    async (blob: Blob, original?: Blob) => {
      const fd = new FormData();
      fd.append("file", blob, "banner.jpg");
      if (original) fd.append("original", original, "original");
      const result = await uploadBannerAction(group.id, fd);
      if (!result.ok) throw new Error(result.error);
      setGroup((g) => ({ ...g, bannerUrl: result.url }));
    },
    [group.id],
  );

  const bannerOriginalUrl = supabase.storage
    .from("banners")
    .getPublicUrl(`${group.id}/original`).data.publicUrl;

  const handleRemoveBanner = useCallback(async () => {
    setGroup((g) => ({ ...g, bannerUrl: undefined }));
    await supabase
      .from("campaigns")
      .update({ banner_url: null })
      .eq("id", group.id);
  }, [supabase, group.id]);

  const handleSetMemberDm = useCallback(
    async (userId: string, isDm: boolean) => {
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, isDm } : m)),
      );
      const result = await setMemberDmAction(group.id, userId, isDm);
      if (!result.ok) {
        // Revert on failure.
        setMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, isDm: !isDm } : m)),
        );
      }
    },
    [group.id],
  );

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      const prev = members;
      setMembers((cur) => cur.filter((m) => m.userId !== userId));
      const result = await removeMemberAction(group.id, userId);
      if (!result.ok) {
        setMembers(prev); // revert
      } else {
        router.refresh();
      }
    },
    [group.id, members, router],
  );

  // QuickFill handlers for use in the sidebar (need current month days).
  const handleBulkFillFromSidebar = useCallback(
    (weekdays: Weekday[], value: VoteValue) => {
      const set = new Set(weekdays);
      const isoDates = currentMonthDays
        .filter((d) => d.inCurrentMonth && set.has(d.weekday as Weekday))
        .map((d) => d.iso);
      handleBulkFill(weekdays, value, isoDates);
    },
    [currentMonthDays, handleBulkFill],
  );

  const handleResetFromSidebar = useCallback(() => {
    const isoDates = currentMonthDays
      .filter((d) => d.inCurrentMonth)
      .map((d) => d.iso);
    handleResetMonth(isoDates);
  }, [currentMonthDays, handleResetMonth]);

  // Sorted members: DMs first.
  const sortedMembers = [...members].sort((a, b) =>
    a.isDm === b.isDm ? 0 : a.isDm ? -1 : 1,
  );

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col",
        `bg-scene-${group.background}`,
      )}
    >
      <div className="relative flex min-h-screen flex-col">
        <AppHeader
          firstName={firstName}
          email={props.currentUser.email}
          characterName={props.currentUser.characterName}
          displayName={props.currentUser.displayName}
          avatarUrl={props.currentUser.avatarUrl}
        />

        {/* Banner card — avatars top-left, campaign name bottom-left */}
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-5">
          <div className={cn(
            "relative overflow-hidden rounded-xl shadow-parchment",
            group.bannerUrl ? "h-28 sm:h-36" : "flex items-end pb-3 pt-4 min-h-[56px]",
          )}>
            {group.bannerUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={group.bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* top scrim for avatars */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-transparent" />
                {/* bottom scrim for title */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              </>
            )}

            {/* Party avatars — top-left */}
            <div className="absolute left-4 top-3 flex items-center sm:left-5">
              {sortedMembers.map((m, i) => (
                <div
                  key={m.userId}
                  className="relative -mr-2 shrink-0"
                  style={{ zIndex: sortedMembers.length - i }}
                  title={m.user.characterName || m.user.displayName || m.user.email}
                >
                  <Avatar
                    src={m.user.avatarUrl}
                    alt={m.user.characterName || m.user.displayName || ""}
                    size={28}
                    className={cn(
                      "ring-2",
                      group.bannerUrl
                        ? m.isDm ? "ring-dm-gold" : "ring-white/25"
                        : m.isDm ? "ring-dm-gold" : "ring-hairline",
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Campaign name — bottom-left */}
            {group.bannerUrl ? (
              <div className="absolute inset-x-0 bottom-0 px-4 pb-3 sm:px-5">
                <h1 className="truncate border-l-2 border-dm-gold pl-3 font-display text-xl font-bold text-surface drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
                  {group.name}
                </h1>
              </div>
            ) : (
              <h1 className="truncate pl-4 font-display text-2xl font-bold text-ink sm:pl-5">
                {group.name}
              </h1>
            )}
          </div>
        </div>

        <main
          className={cn(
            "mx-auto flex w-full max-w-[1440px] flex-1 flex-col",
            settingsOpen
              ? "lg:grid lg:grid-cols-[280px_1fr_300px]"
              : "lg:grid lg:grid-cols-[280px_1fr]",
          )}
        >
          {/* Left sidebar: quick fill + best day (desktop only) */}
          <aside className="hidden border-r border-hairline/70 lg:block">
            <div className="flex flex-col gap-4 p-5">
              <QuickFillBar
                viableWeekdays={group.viableWeekdays}
                onApply={handleBulkFillFromSidebar}
                onReset={handleResetFromSidebar}
              />
              <BestDaySummary
                bestDayIso={bestDayIso}
                yesCount={leadingYesCount}
                memberCount={members.length}
              />
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-2 text-xs font-body font-bold text-ink-soft shadow-sm hover:bg-parchment hover:text-ink"
                >
                  <span className="font-display tracking-wider uppercase">Poll settings</span>
                </button>
              )}
            </div>
          </aside>

          {/* Calendar column */}
          <div className="flex flex-col">
            {/* Mobile: quick fill below calendar header */}
            <div className="lg:hidden">
              <CalendarPanel
                dmUserIds={dmUserIds}
                nameByUserId={nameByUserId}
                myUserId={props.currentUser.id}
                votes={votes}
                viableWeekdays={group.viableWeekdays}
                onCycleDay={handleCycle}
                onBestDayChange={setBestDayIso}
                onDaysChange={setCurrentMonthDays}
                isCreator={isCreator}
                onOpenSettings={() => setSettingsOpen(true)}
              />
              <div className="px-4 pb-2 sm:px-5">
                <QuickFillBar
                  viableWeekdays={group.viableWeekdays}
                  onApply={handleBulkFillFromSidebar}
                  onReset={handleResetFromSidebar}
                />
              </div>
              <div className="px-4 pb-4 sm:px-5">
                <BestDaySummary
                  bestDayIso={bestDayIso}
                  yesCount={leadingYesCount}
                  memberCount={members.length}
                />
              </div>
            </div>
            {/* Desktop calendar (no QuickFillBar inside) */}
            <div className="hidden lg:flex lg:flex-col lg:flex-1">
              <CalendarPanel
                dmUserIds={dmUserIds}
                nameByUserId={nameByUserId}
                myUserId={props.currentUser.id}
                votes={votes}
                viableWeekdays={group.viableWeekdays}
                onCycleDay={handleCycle}
                onBestDayChange={setBestDayIso}
                onDaysChange={setCurrentMonthDays}
                isCreator={isCreator}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </div>
          </div>

          {settingsOpen && isCreator && (
            <aside className="hidden border-l border-hairline/70 bg-parchment/30 lg:order-3 lg:block">
              <OwnerSettings
                members={members}
                creatorId={group.creatorId}
                viableWeekdays={group.viableWeekdays}
                background={group.background}
                bannerUrl={group.bannerUrl}
                bannerOriginalUrl={bannerOriginalUrl}
                onToggleWeekday={handleToggleWeekday}
                onChangeBackground={handleChangeBackground}
                onUploadBanner={handleUploadBanner}
                onRemoveBanner={handleRemoveBanner}
                onSetMemberDm={handleSetMemberDm}
                onRemoveMember={handleRemoveMember}
                onClose={() => setSettingsOpen(false)}
              />
            </aside>
          )}
        </main>

        {settingsOpen && isCreator && (
          <MobileSettingsSheet
            onClose={() => setSettingsOpen(false)}
            members={members}
            creatorId={group.creatorId}
            viableWeekdays={group.viableWeekdays}
            background={group.background}
            bannerUrl={group.bannerUrl}
            bannerOriginalUrl={bannerOriginalUrl}
            onToggleWeekday={handleToggleWeekday}
            onChangeBackground={handleChangeBackground}
            onUploadBanner={handleUploadBanner}
            onRemoveBanner={handleRemoveBanner}
            onSetMemberDm={handleSetMemberDm}
            onRemoveMember={handleRemoveMember}
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
  members,
  creatorId,
  viableWeekdays,
  background,
  bannerUrl,
  bannerOriginalUrl,
  onToggleWeekday,
  onChangeBackground,
  onUploadBanner,
  onRemoveBanner,
  onSetMemberDm,
  onRemoveMember,
}: {
  onClose: () => void;
  members: MemberWithUser[];
  creatorId: string;
  viableWeekdays: Weekday[];
  background: BackgroundScene;
  bannerUrl?: string;
  bannerOriginalUrl?: string;
  onToggleWeekday: (w: Weekday) => void;
  onChangeBackground: (bg: BackgroundScene) => void;
  onUploadBanner: (blob: Blob, original?: Blob) => Promise<void>;
  onRemoveBanner: () => void;
  onSetMemberDm: (userId: string, isDm: boolean) => void;
  onRemoveMember: (userId: string) => void;
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
            members={members}
            creatorId={creatorId}
            viableWeekdays={viableWeekdays}
            background={background}
            bannerUrl={bannerUrl}
            bannerOriginalUrl={bannerOriginalUrl}
            onToggleWeekday={onToggleWeekday}
            onChangeBackground={onChangeBackground}
            onUploadBanner={onUploadBanner}
            onRemoveBanner={onRemoveBanner}
            onSetMemberDm={onSetMemberDm}
            onRemoveMember={onRemoveMember}
            onClose={onClose}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
