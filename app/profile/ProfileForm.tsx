"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { Avatar } from "@/components/council/Avatar";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { updateProfileAction } from "./actions";

const PORTRAITS = [
  "/images/avatar-mara.png",
  "/images/avatar-torgrim.png",
  "/images/avatar-sylvara.png",
  "/images/avatar-alaric.png",
  "/images/avatar-nyx.png",
  "/images/avatar-aldous.png",
];

type Initial = {
  character_name: string;
  display_name: string;
  avatar_url: string | null;
};

export function ProfileForm({
  email,
  initial,
}: {
  email: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [character, setCharacter] = useState(initial.character_name);
  const [display, setDisplay] = useState(initial.display_name);
  const [avatar, setAvatar] = useState<string>(
    initial.avatar_url ?? PORTRAITS[3],
  );
  const [showError, setShowError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!character.trim() || !display.trim()) {
      setShowError(true);
      return;
    }
    startTransition(async () => {
      const result = await updateProfileAction({
        character_name: character,
        display_name: display,
        avatar_url: avatar,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.push(result.nextHref);
      router.refresh();
    });
  }

  return (
    <StageBackdrop>
      <ParchmentCard className="w-full max-w-[560px] p-7 sm:p-10">
        <header className="flex flex-col items-center text-center gap-3">
          <Crest size={56} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl text-ink">
            Take your seat at the table
          </h1>
          <p className="text-ink-soft max-w-[42ch]">
            Signed in as{" "}
            <span className="font-display text-ink">{email}</span>. Tell the
            council who you are.
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
            error={
              showError && !character.trim()
                ? "A character name is required to take a seat at the table."
                : undefined
            }
          />
          <TextField
            label="Your name"
            placeholder="Felix Hoge"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            error={
              showError && !display.trim()
                ? "Your name is required so the party can address you."
                : undefined
            }
          />
          <p className="text-xs text-ink-soft text-center">
            Both fields are required to join a group.
          </p>

          {serverError && (
            <p className="rounded-md border border-vote-no/40 bg-vote-no/10 px-3 py-2 text-xs text-vote-no">
              {serverError}
            </p>
          )}

          <WaxButton type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Take my seat"}
          </WaxButton>
        </form>
      </ParchmentCard>
    </StageBackdrop>
  );
}
