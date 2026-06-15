"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/council/TopBar";
import { RosterPanel } from "@/components/council/RosterPanel";
import { CalendarPanel } from "@/components/council/CalendarPanel";
import { OwnerSettings } from "@/components/council/OwnerSettings";
import { BestDaySummary } from "@/components/council/BestDaySummary";
import { useCouncil } from "@/lib/store";
import {
  defaultMonth,
  shortMonthLabel,
} from "@/lib/calendar";
import type { BackgroundScene, VoteValue, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GroupView() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const groups = useCouncil((s) => s.groups);
  const allMembers = useCouncil((s) => s.members);
  const users = useCouncil((s) => s.users);
  const allVotes = useCouncil((s) => s.votes);
  const setVote = useCouncil((s) => s.setVote);
  const bulkFillVote = useCouncil((s) => s.bulkFillVote);
  const setViableWeekdays = useCouncil((s) => s.setViableWeekdays);
  const setBackground = useCouncil((s) => s.setBackground);
  const currentUserId = useCouncil((s) => s.currentUserId);

  const group = useMemo(
    () => groups.find((g) => g.slug === params.slug),
    [groups, params.slug],
  );
  const members = useMemo(
    () =>
      group
        ? allMembers
            .filter((m) => m.groupId === group.id)
            .map((m) => ({ ...m, user: users.find((u) => u.id === m.userId)! }))
        : [],
    [allMembers, users, group],
  );
  const votes = useMemo(
    () => (group ? allVotes.filter((v) => v.groupId === group.id) : []),
    [allVotes, group],
  );
  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId],
  );

  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bestDayIso, setBestDayIso] = useState<string | null>(null);

  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (mounted && !currentUserId) {
      const mara = useCouncil.getState().users.find((u) => u.id === "u_mara");
      if (mara) useCouncil.setState({ currentUserId: mara.id });
    }
  }, [mounted, currentUserId]);

  if (!mounted) return null;
  if (!group) {
    router.replace("/login");
    return null;
  }

  const isCreator = currentUserId === group.creatorId;
  const { year, monthIndex } = defaultMonth();
  const subtitle = `Council of Days · ${members.length} members · ${shortMonthLabel(year, monthIndex)}`;

  const dm = members.find((m) => m.userId === group.dmId);
  const leadingVotes = bestDayIso
    ? votes.filter((v) => v.date === bestDayIso)
    : [];
  const participantCount = members.filter((m) => m.userId !== group.dmId).length;
  const leadingYesExclDm = leadingVotes.filter(
    (v) => v.value === "yes" && v.userId !== group.dmId,
  ).length;

  function handleCycle(date: string, current: VoteValue | undefined) {
    if (!currentUserId || !group) return;
    const next: VoteValue | null =
      current === "yes"
        ? "maybe"
        : current === "maybe"
          ? "no"
          : current === "no"
            ? null
            : "yes";
    setVote(group.id, currentUserId, date, next);
  }

  return (
    <div className={cn("relative flex min-h-screen flex-col", `bg-scene-${group.background}`)}>
      {/* Parchment-tinted overlay softens the scene so dark ink text reads. */}
      <div className="pointer-events-none absolute inset-0 bg-parchment/85" aria-hidden />
      <div className="relative flex min-h-screen flex-col">
        <TopBar
          groupName={group.name}
          subtitle={subtitle}
          slug={group.slug}
          currentUser={currentUser}
          isCreator={isCreator}
          onOpenSettings={isCreator ? () => setSettingsOpen(true) : undefined}
        />

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
              members={members}
              dmId={group.dmId}
              myUserId={currentUserId}
              leadingDayIso={bestDayIso}
              votes={votes}
            />
          </div>
          <div className="flex flex-col">
            <CalendarPanel
              dmId={group.dmId}
              myUserId={currentUserId}
              votes={votes}
              viableWeekdays={group.viableWeekdays}
              onCycleDay={handleCycle}
              onBulkFill={(_w, value, isoDates) =>
                currentUserId &&
                bulkFillVote(group.id, currentUserId, isoDates, value)
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
                onToggleWeekday={(w) => toggleWeekday(group.id, group.viableWeekdays, w, setViableWeekdays)}
                onChangeBackground={(bg) => setBackground(group.id, bg)}
                onClose={() => setSettingsOpen(false)}
              />
            </aside>
          )}
        </main>

        {/* Mobile bottom-sheet variant */}
        {settingsOpen && isCreator && (
          <MobileSettingsSheet
            onClose={() => setSettingsOpen(false)}
            dmName={dm?.user.characterName ?? "The DM"}
            viableWeekdays={group.viableWeekdays}
            background={group.background}
            onToggleWeekday={(w) => toggleWeekday(group.id, group.viableWeekdays, w, setViableWeekdays)}
            onChangeBackground={(bg) => setBackground(group.id, bg)}
          />
        )}
      </div>
    </div>
  );
}

function toggleWeekday(
  groupId: string,
  current: Weekday[],
  w: Weekday,
  set: (groupId: string, weekdays: Weekday[]) => void,
) {
  const has = current.includes(w);
  const next = has ? current.filter((x) => x !== w) : [...current, w];
  set(groupId, next as Weekday[]);
}

function MobileSettingsSheet({
  onClose,
  dmName,
  viableWeekdays,
  background,
  onToggleWeekday,
  onChangeBackground,
}: {
  onClose: () => void;
  dmName: string;
  viableWeekdays: Weekday[];
  background: BackgroundScene;
  onToggleWeekday: (w: Weekday) => void;
  onChangeBackground: (bg: BackgroundScene) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-hairline bg-parchment-texture shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1.5 w-10 rounded-full bg-ink-soft/30" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <OwnerSettings
            dmName={dmName}
            viableWeekdays={viableWeekdays}
            background={background}
            onToggleWeekday={onToggleWeekday}
            onChangeBackground={onChangeBackground}
            onClose={onClose}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
