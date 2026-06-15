"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Crown } from "lucide-react";
import { Avatar } from "./Avatar";
import { VoteChip } from "./VoteChip";
import { WaxButton } from "./WaxButton";
import { useCouncil } from "@/lib/store";
import { longDateLabel, weekdayLabel } from "@/lib/calendar";
import type { VoteValue } from "@/lib/types";

export function DayDetailPanel({ slug, date }: { slug: string; date: string }) {
  const router = useRouter();
  const groups = useCouncil((s) => s.groups);
  const allMembers = useCouncil((s) => s.members);
  const users = useCouncil((s) => s.users);
  const allVotes = useCouncil((s) => s.votes);
  const setVote = useCouncil((s) => s.setVote);
  const currentUserId = useCouncil((s) => s.currentUserId);

  const group = useMemo(() => groups.find((g) => g.slug === slug), [groups, slug]);
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
    () => (group ? allVotes.filter((v) => v.groupId === group.id && v.date === date) : []),
    [allVotes, group, date],
  );

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  });

  function close() {
    router.push(`/g/${slug}`, { scroll: false });
  }

  if (!group) return null;

  const dmId = group.dmId;
  const dm = members.find((m) => m.userId === dmId);
  const voteByUser: Record<string, VoteValue | undefined> = Object.fromEntries(
    votes.map((v) => [v.userId, v.value]),
  );
  const dmVote = voteByUser[dmId];
  const yesCount = Object.values(voteByUser).filter((v) => v === "yes").length;
  const players = members.filter((m) => m.userId !== dmId);
  const myVote = currentUserId ? voteByUser[currentUserId] : undefined;

  const dmLine =
    dmVote === "yes"
      ? `${dm?.user.characterName ?? "The DM"} is in — the table can convene.`
      : dmVote === "maybe"
        ? `${dm?.user.characterName ?? "The DM"} may join — keep the seat warm.`
        : dmVote === "no"
          ? `${dm?.user.characterName ?? "The DM"} is out — choose another day.`
          : `${dm?.user.characterName ?? "The DM"} has not cast a vote yet.`;

  return (
    <>
      <button
        aria-label="Close day detail"
        onClick={close}
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
      />
      <aside
        className="fixed right-0 top-0 z-40 flex h-full w-full max-w-[440px] flex-col border-l border-hairline bg-parchment-texture shadow-2xl"
        role="dialog"
        aria-label={`Details for ${longDateLabel(date)}`}
      >
        <div className="flex items-start justify-between border-b border-hairline px-6 py-5">
          <div>
            <p className="font-display text-2xl text-ink leading-none">
              {weekdayLabel(date)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{longDateLabel(date)}</p>
          </div>
          <button
            onClick={close}
            className="rounded-md p-1 text-ink-soft hover:bg-parchment hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {dm && (
            <section className="flex items-start gap-3 rounded-card border border-dm-gold/40 bg-dm-gold/10 p-3">
              <Avatar src={dm.user.avatarUrl} alt={dm.user.characterName} size={48} ring="gold" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[11px] font-display tracking-wider uppercase text-dm-gold">
                  <Crown className="h-3.5 w-3.5" /> Dungeon Master
                </p>
                <p className="mt-0.5 font-display text-base text-ink">{dm.user.characterName}</p>
                <p className="mt-1 text-sm italic text-ink-soft">{dmLine}</p>
              </div>
              {dmVote && <VoteChip value={dmVote} />}
            </section>
          )}

          <section>
            <p className="small-caps">The Party · {yesCount} yes</p>
            <ul className="mt-2 space-y-1.5">
              {players.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 rounded-md border border-hairline/60 bg-surface/60 px-3 py-2"
                >
                  <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{m.user.characterName}</p>
                    <p className="truncate text-[11px] text-ink-soft">{m.user.displayName}</p>
                  </div>
                  <VoteChip value={voteByUser[m.userId] ?? null} />
                </li>
              ))}
            </ul>
          </section>

          {currentUserId && (
            <section>
              <p className="small-caps">Your vote</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["yes", "maybe", "no"] as const).map((value) => {
                  const active = myVote === value;
                  const cls =
                    value === "yes"
                      ? "text-vote-yes border-vote-yes"
                      : value === "maybe"
                        ? "text-vote-maybe border-vote-maybe"
                        : "text-vote-no border-vote-no";
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setVote(group.id, currentUserId, date, active ? null : value)
                      }
                      className={`h-12 rounded-md border-2 font-display text-base capitalize transition ${cls} ${
                        active ? "bg-current/10" : "bg-surface/70 hover:bg-parchment"
                      }`}
                    >
                      {value === "yes" ? "✓ Available" : value === "maybe" ? "~ Maybe" : "✗ Out"}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-hairline px-6 py-4">
          <WaxButton variant="outline" className="w-full" onClick={close}>
            Close
          </WaxButton>
        </div>
      </aside>
    </>
  );
}
