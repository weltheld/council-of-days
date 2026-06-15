"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { Avatar } from "@/components/council/Avatar";
import { useCouncil } from "@/lib/store";

export default function InvitePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const groups = useCouncil((s) => s.groups);
  const allMembers = useCouncil((s) => s.members);
  const users = useCouncil((s) => s.users);
  const allInvites = useCouncil((s) => s.invitations);
  const invitePlayer = useCouncil((s) => s.inviteByEmail);

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
  const invites = useMemo(
    () => (group ? allInvites.filter((i) => i.groupId === group.id) : []),
    [allInvites, group],
  );

  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (mounted && !group) router.replace("/login");
  }, [mounted, group, router]);

  const inviteLink = useMemo(
    () => (group ? `councilofdays.app/join/${group.slug}-7gk2` : ""),
    [group],
  );

  if (!mounted || !group) return null;

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !group) return;
    invitePlayer(group.id, email);
    setEmail("");
  }

  return (
    <StageBackdrop>
      <ParchmentCard className="w-full max-w-[560px] p-8 sm:p-10">
        <header className="flex flex-col items-center text-center gap-3">
          <Crest size={56} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl text-ink">Summon Your Party</h1>
          <p className="text-ink-soft italic">{group.name} awaits its adventurers.</p>
        </header>

        <section className="mt-7 space-y-2">
          <p className="small-caps">Magic invite link</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 h-11 px-3 rounded-md border border-hairline bg-surface/80 text-ink font-mono text-sm"
            />
            <WaxButton
              type="button"
              variant="outline"
              onClick={() => navigator.clipboard?.writeText(inviteLink)}
            >
              Copy
            </WaxButton>
          </div>
          <p className="text-xs text-ink-soft">Anyone with this link joins as a party member.</p>
        </section>

        <section className="mt-7 space-y-3">
          <p className="small-caps">The party so far</p>
          <ul className="space-y-2">
            {members
              .filter((m) => m.role === "participant")
              .map((m) => (
                <li key={m.userId} className="flex items-center justify-between rounded-md border border-hairline/60 bg-surface/60 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.user.avatarUrl} alt={m.user.displayName} size={32} />
                    <span className="text-ink">{m.user.displayName}</span>
                  </div>
                  <span className="text-xs font-display tracking-wider uppercase text-vote-yes">Joined</span>
                </li>
              ))}
            {invites.map((i) => {
              const label =
                i.email ??
                users.find((u) => u.id === i.userId)?.displayName ??
                "Adventurer";
              return (
                <li
                  key={`${i.email ?? i.userId}`}
                  className="flex items-center justify-between rounded-md border border-hairline/60 bg-surface/40 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar alt={label} size={32} />
                    <span className="text-ink-soft">{label}</span>
                  </div>
                  <span className="text-xs font-display tracking-wider uppercase text-gold">
                    Pending
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <form onSubmit={send} className="mt-6 flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label="Send by email"
              type="email"
              placeholder="adventurer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <WaxButton type="submit">Send</WaxButton>
        </form>

        <div className="mt-6 flex justify-end">
          <WaxButton variant="outline" onClick={() => router.push(`/g/${group.slug}`)}>
            Enter the company &rarr;
          </WaxButton>
        </div>
      </ParchmentCard>
    </StageBackdrop>
  );
}
