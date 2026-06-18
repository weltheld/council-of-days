"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/council/AppHeader";
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

        {/* D4 banner card — inset below the header with uniform spacing */}
        {group.bannerUrl ? (
          <div className="mx-auto w-full max-w-[1440px] pt-4">
            <div className="relative h-32 overflow-hidden rounded-xl shadow-parchment sm:h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={group.bannerUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/65" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
                <h1 className="truncate border-l-2 border-dm-gold pl-3 font-display text-xl font-bold text-surface drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
                  {group.name}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-5">
            <h1 className="truncate font-display text-2xl font-bold text-ink">
              {group.name}
            </h1>
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
          <div className="order-2 border-b border-hairline/70 lg:order-1 lg:border-b-0 lg:border-r">
            <RosterPanel members={members} myUserId={props.currentUser.id} />
            <div className="hidden flex-col gap-3 px-4 pb-4 sm:px-5 lg:flex">
              <BestDaySummary
                bestDayIso={bestDayIso}
                yesCount={leadingYesCount}
                memberCount={members.length}
              />
              <div className="flex items-center gap-2.5 text-[11px] text-ink-soft">
                {[
                  { label: "Yes", swatch: "bg-[#D5D9C4]" },
                  { label: "Maybe", swatch: "bg-[#EDE0BE]" },
                  { label: "No", swatch: "bg-[#E8D2C5]" },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-sm border border-ink/15", l.swatch)} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 flex flex-col lg:order-2">
            <CalendarPanel
              dmUserIds={dmUserIds}
              nameByUserId={nameByUserId}
              myUserId={props.currentUser.id}
              votes={votes}
              viableWeekdays={group.viableWeekdays}
              onCycleDay={handleCycle}
              onBulkFill={(w, value, isoDates) =>
                handleBulkFill(w, value, isoDates)
              }
              onReset={handleResetMonth}
              onBestDayChange={setBestDayIso}
              isCreator={isCreator}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <div className="px-4 pb-4 sm:px-5 lg:hidden">
              <BestDaySummary
                bestDayIso={bestDayIso}
                yesCount={leadingYesCount}
                memberCount={members.length}
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
