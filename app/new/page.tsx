"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link as LinkIcon, Lock, Plus, ScrollText, Sparkles, Users } from "lucide-react";
import { Avatar } from "@/components/council/Avatar";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { useCouncil } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function CreateCampaignPollPage() {
  const router = useRouter();

  const currentUserId = useCouncil((s) => s.currentUserId);
  const users = useCouncil((s) => s.users);
  const groups = useCouncil((s) => s.groups);
  const invitations = useCouncil((s) => s.invitations);
  const createGroup = useCouncil((s) => s.createGroup);
  const inviteExistingUser = useCouncil((s) => s.inviteExistingUser);
  const removeInvitation = useCouncil((s) => s.removeInvitation);
  const launchCampaign = useCouncil((s) => s.launchCampaign);

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (mounted && !currentUserId) router.replace("/login");
  }, [mounted, currentUserId, router]);

  const me = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId],
  );

  const createdGroup = useMemo(
    () => (createdGroupId ? groups.find((g) => g.id === createdGroupId) ?? null : null),
    [groups, createdGroupId],
  );

  const inviteList = useMemo(
    () =>
      createdGroupId
        ? invitations.filter((i) => i.groupId === createdGroupId && i.userId)
        : [],
    [invitations, createdGroupId],
  );

  const otherUsers = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId],
  );

  if (!mounted || !me) return null;

  const isCreated = !!createdGroup;
  const signUpLink = createdGroup
    ? `councilofdays.app/signup/${createdGroup.slug}`
    : "Create campaign to generate link";

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const g = createGroup(name.trim(), "");
    setCreatedGroupId(g.id);
  }

  function toggleInvite(userId: string) {
    if (!createdGroupId) return;
    const isInvited = inviteList.some((i) => i.userId === userId);
    if (isInvited) removeInvitation(createdGroupId, { userId });
    else inviteExistingUser(createdGroupId, userId);
  }

  function handleLaunch() {
    if (!createdGroup) return;
    launchCampaign(createdGroup.id);
    router.push(`/g/${createdGroup.slug}`);
  }

  return (
    <StageBackdrop>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 py-6 sm:py-10">
        <header className="flex flex-col items-center text-center gap-2">
          <Crest size={48} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">
            Forge a campaign-poll
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Campaign Form */}
          <section className="rounded-card border border-hairline/70 bg-surface/95 p-6 sm:p-8 shadow-card">
            <Pill icon={ScrollText} label="Step 1 · Campaign" />

            <h2 className="mt-4 font-display text-2xl text-ink">
              {isCreated
                ? `${createdGroup!.name} is ready for invites`
                : "Create a campaign-poll"}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {isCreated
                ? "The creator owns the invite controls before the voting calendar opens."
                : "Start with a campaign name. Invites can be prepared immediately after creation."}
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <TextField
                label="Campaign name"
                placeholder="Ashes of June"
                value={isCreated ? createdGroup!.name : name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreated}
                required
              />

              <div className="flex items-start gap-2 rounded-md border border-dm-gold/30 bg-dm-gold/10 px-3 py-2.5">
                <Lock className="mt-0.5 h-4 w-4 flex-none text-dm-gold" />
                <p className="text-xs text-ink-soft">
                  Only the campaign creator can generate links or add existing users
                  before launch.
                </p>
              </div>

              {!isCreated ? (
                <WaxButton type="submit" className="w-full justify-center">
                  Create campaign-poll
                </WaxButton>
              ) : (
                <WaxButton
                  type="button"
                  onClick={handleLaunch}
                  className="w-full justify-center"
                >
                  Launch campaign-poll &rarr;
                </WaxButton>
              )}

              <div className="rounded-md border border-hairline/70 bg-parchment/40 px-3 py-2.5">
                <p className="small-caps">
                  {isCreated ? "Ready to launch" : "Starting state"}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {isCreated
                    ? "Campaign name saved, share link active, and selected users queued for invitation."
                    : "No calendar votes yet. The next step creates invite options without entering the voting view."}
                </p>
              </div>
            </form>
          </section>

          {/* Right: Invite Panel */}
          <section
            className={cn(
              "rounded-card border border-hairline/70 bg-surface/95 p-6 sm:p-8 shadow-card transition",
              !isCreated && "opacity-90",
            )}
          >
            <Pill icon={Sparkles} label="Creator-only invites" />
            <h2 className="mt-4 font-display text-2xl text-ink">Invite participants</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {isCreated
                ? "Use the public sign-up link for new people, or choose registered users below."
                : "Invite tools appear here as soon as the campaign-poll is created."}
            </p>

            <div className="mt-5 space-y-2">
              <p className="small-caps">New participants · Sign-up link</p>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-md border px-3 py-2.5 font-mono text-sm",
                    isCreated
                      ? "border-hairline bg-surface/80 text-wine"
                      : "border-hairline bg-parchment/40 text-ink-soft/70",
                  )}
                >
                  <LinkIcon className="h-4 w-4 flex-none text-dm-gold" />
                  <span className="truncate">{signUpLink}</span>
                </div>
                <button
                  type="button"
                  disabled={!isCreated}
                  onClick={() => isCreated && navigator.clipboard?.writeText(signUpLink)}
                  className={cn(
                    "h-10 rounded-md px-4 font-display text-xs tracking-wider uppercase",
                    isCreated
                      ? "bg-wine text-parchment hover:bg-wine/90"
                      : "bg-parchment/60 text-ink-soft/60 cursor-not-allowed",
                  )}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="small-caps">Existing platform users</p>
              {!isCreated ? (
                <div className="rounded-md border border-hairline/70 bg-parchment/40 p-5 text-center">
                  <Users className="mx-auto h-6 w-6 text-dm-gold" />
                  <p className="mt-2 font-display text-sm text-ink">
                    No invitees selected yet
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Registered users can be selected after the campaign-poll exists.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {otherUsers.map((u) => {
                    const selected = inviteList.some((i) => i.userId === u.id);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => toggleInvite(u.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition",
                            selected
                              ? "border-vote-yes/40 bg-vote-yes/10"
                              : "border-hairline/60 bg-surface/60 hover:bg-parchment/40",
                          )}
                        >
                          <Avatar src={u.avatarUrl} alt={u.displayName} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-ink">
                              {u.displayName}
                            </p>
                            <p className="truncate text-xs text-ink-soft">{u.email}</p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-full transition",
                              selected
                                ? "bg-vote-yes text-parchment"
                                : "border-2 border-dm-gold/40 text-dm-gold",
                            )}
                          >
                            {selected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </StageBackdrop>
  );
}

function Pill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-dm-gold/15 px-3 py-1 text-[11px] font-display tracking-wider uppercase text-dm-gold">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
