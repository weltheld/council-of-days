"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { TopBar } from "@/components/council/TopBar";
import { RosterPanel } from "@/components/council/RosterPanel";
import { CalendarPanel } from "@/components/council/CalendarPanel";
import { useCouncil } from "@/lib/store";
import { defaultMonth, shortMonthLabel } from "@/lib/calendar";

export function GroupView() {
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const groups = useCouncil((s) => s.groups);
  const allMembers = useCouncil((s) => s.members);
  const users = useCouncil((s) => s.users);
  const allVotes = useCouncil((s) => s.votes);
  const setVote = useCouncil((s) => s.setVote);
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (mounted && !currentUserId) {
      // Auto-pick Mara for the seeded demo so the screen lights up.
      const mara = useCouncil.getState().users.find((u) => u.id === "u_mara");
      if (mara) useCouncil.setState({ currentUserId: mara.id });
    }
  }, [mounted, currentUserId]);

  const focusedDate = useMemo(() => {
    const m = pathname?.match(/\/d\/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }, [pathname]);

  const focusedVotes = useMemo(
    () => (focusedDate ? votes.filter((v) => v.date === focusedDate) : []),
    [votes, focusedDate],
  );

  if (!mounted) return null;
  if (!group) {
    router.replace("/login");
    return null;
  }

  const { year, monthIndex } = defaultMonth();
  const subtitle = `Council of Days · ${members.length} members · ${shortMonthLabel(year, monthIndex)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar groupName={group.name} subtitle={subtitle} slug={group.slug} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:grid lg:grid-cols-[332px_1fr]">
        <div className="border-b border-hairline lg:border-b-0 lg:border-r">
          <RosterPanel
            members={members}
            dmId={group.dmId}
            focusedDate={focusedDate}
            votesForFocusedDay={focusedVotes}
          />
        </div>
        <CalendarPanel
          slug={group.slug}
          dmId={group.dmId}
          myUserId={currentUserId}
          members={members}
          votes={votes}
          focusedDate={focusedDate}
          onVote={(date, value) => currentUserId && setVote(group.id, currentUserId, date, value)}
        />
      </main>
    </div>
  );
}
