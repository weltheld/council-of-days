"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { useCouncil } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useCouncil((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    const token = Math.random().toString(36).slice(2, 10);
    setSent(`http://localhost:3000/api/auth/${token}?email=${encodeURIComponent(email)}`);
  }

  function onContinue() {
    signIn(email);
    router.push("/profile");
  }

  return (
    <StageBackdrop>
      <ParchmentCard className="w-full max-w-[460px] p-8 sm:p-10">
        <header className="flex flex-col items-center text-center gap-4">
          <Crest size={72} />
          <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-wide">
            Council of Days
          </h1>
          <p className="text-ink-soft italic max-w-[34ch]">
            Gather your party. Choose your day.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <TextField
            label="Your email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="adventurer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <WaxButton type="submit" className="w-full">
            Send sign-in link
          </WaxButton>
          <p className="text-xs text-ink-soft text-center leading-relaxed">
            No passwords. We&apos;ll send a one-time sign-in link &mdash; it expires in 15 minutes.
          </p>
        </form>

        {sent && (
          <div className="mt-6 rounded-md border border-gold/40 bg-gold/10 p-4 text-sm">
            <p className="font-display tracking-wider uppercase text-xs text-dm-gold">
              Magic link (local dev)
            </p>
            <p className="mt-1 text-ink-soft break-all">{sent}</p>
            <WaxButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onContinue}
              className="mt-3"
            >
              Open link &rarr;
            </WaxButton>
          </div>
        )}
      </ParchmentCard>
    </StageBackdrop>
  );
}
