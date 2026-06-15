"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { Avatar } from "@/components/council/Avatar";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { useCouncil } from "@/lib/store";

const PORTRAITS = [
  "/images/avatar-mara.png",
  "/images/avatar-torgrim.png",
  "/images/avatar-sylvara.png",
  "/images/avatar-alaric.png",
  "/images/avatar-nyx.png",
  "/images/avatar-aldous.png",
];

export default function ProfilePage() {
  const router = useRouter();
  const currentUserId = useCouncil((s) => s.currentUserId);
  const users = useCouncil((s) => s.users);
  const groups = useCouncil((s) => s.groups);
  const members = useCouncil((s) => s.members);
  const setProfile = useCouncil((s) => s.setProfile);
  const user = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId],
  );

  const [character, setCharacter] = useState("");
  const [display, setDisplay] = useState("");
  const [avatar, setAvatar] = useState<string>(PORTRAITS[3]);
  const [showError, setShowError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!currentUserId) {
      router.replace("/login");
      return;
    }
    if (user) {
      setCharacter(user.characterName ?? "");
      setDisplay(user.displayName ?? "");
      if (user.avatarUrl) setAvatar(user.avatarUrl);
    }
  }, [mounted, currentUserId, user, router]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!character.trim() || !display.trim()) {
      setShowError(true);
      return;
    }
    setProfile({ characterName: character, displayName: display, avatarUrl: avatar });
    const userMembership = members.find((m) => m.userId === currentUserId);
    if (userMembership) {
      const grp = groups.find((g) => g.id === userMembership.groupId);
      if (grp) {
        router.push(`/g/${grp.slug}`);
        return;
      }
    }
    router.push("/new");
  }

  if (!mounted) return null;

  return (
    <StageBackdrop>
      <ParchmentCard className="w-full max-w-[560px] p-7 sm:p-10">
        <header className="flex flex-col items-center text-center gap-3">
          <Crest size={56} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl text-ink">Take your seat at the table</h1>
          <p className="text-ink-soft max-w-[42ch]">
            Tell the council who you are. Your portrait and names will be shown to every member of your party.
          </p>
        </header>

        <form onSubmit={onSave} className="mt-7 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar src={avatar} alt={character || "Adventurer"} size={96} ring="gold" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PORTRAITS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`h-10 w-10 rounded-full overflow-hidden border ${avatar === p ? "border-dm-gold ring-2 ring-dm-gold" : "border-hairline"}`}
                  aria-label={`Choose portrait ${p}`}
                >
                  <Avatar src={p} alt="portrait" size={40} />
                </button>
              ))}
            </div>
            <p className="small-caps">Change portrait</p>
          </div>

          <TextField
            label="Character name"
            placeholder="Alaric the Gray"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            error={showError && !character.trim() ? "A character name is required to take a seat at the table." : undefined}
          />
          <TextField
            label="Your name"
            placeholder="Felix Hoge"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            error={showError && !display.trim() ? "Your name is required so the party can address you." : undefined}
          />
          <p className="text-xs text-ink-soft text-center">Both fields are required to join a group.</p>

          <WaxButton type="submit" className="w-full">
            Take my seat
          </WaxButton>
        </form>
      </ParchmentCard>
    </StageBackdrop>
  );
}
