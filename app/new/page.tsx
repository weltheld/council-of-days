"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { useCouncil } from "@/lib/store";

export default function NewGroupPage() {
  const router = useRouter();
  const currentUserId = useCouncil((s) => s.currentUserId);
  const createGroup = useCouncil((s) => s.createGroup);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const unsub = useCouncil.persist.onFinishHydration(() => setMounted(true));
    if (useCouncil.persist.hasHydrated()) setMounted(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (mounted && !currentUserId) router.replace("/login");
  }, [mounted, currentUserId, router]);

  if (!mounted) return null;

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const grp = createGroup(name.trim(), note.trim());
    router.push(`/g/${grp.slug}/invite`);
  }

  return (
    <StageBackdrop>
      <ParchmentCard className="w-full max-w-[560px] p-8 sm:p-10">
        <header className="flex flex-col items-center text-center gap-3">
          <Crest size={56} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl text-ink">Found a New Company</h1>
          <p className="text-ink-soft max-w-[42ch]">
            Name your adventuring party and set the tale in motion.
          </p>
        </header>

        <form onSubmit={onCreate} className="mt-7 space-y-5">
          <TextField
            label="Company name"
            placeholder="The Emberfall Company"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block small-caps text-ink-soft">A brief tale</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="A band of unlikely heroes seeking the Ember Crown."
              className="w-full px-3 py-2 rounded-md border border-hairline bg-surface/80 text-ink placeholder-ink-soft/50 focus:bg-surface focus:border-gold transition"
            />
          </div>

          <div className="rounded-md border border-gold/30 bg-gold/10 p-3 text-sm text-ink-soft">
            As founder, you take the <strong className="text-dm-gold">Dungeon Master&apos;s seat</strong> &mdash; your free days rule the calendar.
          </div>

          <p className="text-xs text-ink-soft text-center">
            You can change the name and note later from the company settings.
          </p>

          <WaxButton type="submit" className="w-full">
            Found the company
          </WaxButton>
        </form>
      </ParchmentCard>
    </StageBackdrop>
  );
}
