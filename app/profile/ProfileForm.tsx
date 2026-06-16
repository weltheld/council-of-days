"use client";

import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { ProfileEditor } from "@/components/council/ProfileEditor";

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
            <span className="font-display text-ink">{email}</span>.
          </p>
        </header>

        <div className="mt-7">
          <ProfileEditor initial={initial} mode="onboarding" />
        </div>
      </ParchmentCard>
    </StageBackdrop>
  );
}
