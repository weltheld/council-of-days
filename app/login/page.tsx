"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const search = useSearchParams();
  const next = search.get("next") || "/profile";
  const initialError = search.get("error");
  const initialErrorMessage = search.get("message");

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError
      ? initialErrorMessage ||
          (initialError === "missing_code"
            ? "That sign-in link is incomplete. Try sending a fresh one."
            : "That sign-in link could not be redeemed. Try again.")
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const supabase = getBrowserSupabase();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSending(false);
    }
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

        {sent ? (
          <SentState email={email} onResend={() => setSent(false)} />
        ) : (
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
              disabled={sending}
              error={error ?? undefined}
            />
            <WaxButton type="submit" className="w-full" disabled={sending}>
              {sending ? "Summoning..." : "Send sign-in link"}
            </WaxButton>
            <p className="text-xs text-ink-soft text-center leading-relaxed">
              No passwords. We&apos;ll send a one-time sign-in link &mdash; it
              expires in fifteen minutes.
            </p>
          </form>
        )}
      </ParchmentCard>
    </StageBackdrop>
  );
}

function SentState({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-md border border-dm-gold/40 bg-dm-gold/10 p-4 text-center">
        <p className="font-display tracking-wider uppercase text-xs text-dm-gold">
          Check your inbox
        </p>
        <p className="mt-2 text-sm text-ink leading-snug">
          A sign-in link has been sent to{" "}
          <span className="font-display text-ink">{email}</span>.
        </p>
        <p className="mt-2 text-xs text-ink-soft leading-snug">
          Click the link from any device to take your seat. The link expires in
          fifteen minutes and may be used only once.
        </p>
      </div>
      <WaxButton variant="outline" className="w-full" onClick={onResend}>
        Send to a different email
      </WaxButton>
    </div>
  );
}
