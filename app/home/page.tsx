import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, Users, CalendarDays } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { Crest } from "@/components/council/Crest";
import { Avatar } from "@/components/council/Avatar";
import { signOutAction } from "@/app/auth/actions";
import type { User } from "@/lib/types";

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, character_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("campaign_members")
    .select("campaign_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const campaignIds = (memberships ?? []).map((m) => m.campaign_id);

  const campaigns =
    campaignIds.length > 0
      ? (
          await supabase
            .from("campaigns")
            .select("id, slug, name, phase, creator_id, created_at")
            .in("id", campaignIds)
        ).data ?? []
      : [];

  // Member counts per campaign
  const memberCounts: Record<string, number> = {};
  if (campaignIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("campaign_members")
      .select("campaign_id")
      .in("campaign_id", campaignIds);
    for (const m of allMembers ?? []) {
      memberCounts[m.campaign_id] = (memberCounts[m.campaign_id] ?? 0) + 1;
    }
  }

  const roleById = Object.fromEntries(
    (memberships ?? []).map((m) => [m.campaign_id, m.role]),
  );

  const hostedCount = campaigns.filter(
    (c) => roleById[c.id] === "creator",
  ).length;
  const playerCount = campaigns.length - hostedCount;

  const currentUser: User = {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    displayName: profile?.display_name ?? "",
    characterName: profile?.character_name ?? "",
    avatarUrl: profile?.avatar_url ?? undefined,
  };

  const displayFirst =
    profile?.display_name?.split(" ")[0] ??
    profile?.character_name ??
    user.email?.split("@")[0] ??
    "Adventurer";

  return (
    <div className="min-h-screen bg-parchment">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "url(/images/bg-parchment.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-hairline">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-8 sm:py-[18px]">
          <Crest size={46} className="hidden sm:inline-flex" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold leading-tight text-ink sm:text-[22px]">
              Council of Days
            </h1>
            <p className="text-[11px] font-display text-ink-soft leading-tight">
              Campaign home
            </p>
          </div>
          <div className="flex-1" />
          <AccountChip user={currentUser} />
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-7 px-4 pb-10 pt-7 sm:flex-row sm:items-start sm:gap-7 sm:px-9 sm:pb-9 sm:pt-[30px]">
        {/* Welcome Column */}
        <aside className="w-full shrink-0 sm:w-[376px]">
          <div className="flex flex-col gap-[18px] rounded-xl border border-hairline bg-surface px-6 py-6 shadow-parchment">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-[30px]">
                Welcome back, {displayFirst}
              </h2>
              <p className="font-display text-sm leading-snug text-ink-soft sm:text-[15px]">
                You signed in by email link. Choose a campaign to vote, or start
                hosting a new table.
              </p>
            </div>

            {/* Host CTA */}
            <div className="flex flex-col gap-3 rounded-xl bg-wine px-[18px] py-[18px] shadow-wine">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-dm-gold" />
                <p className="font-display text-xl font-bold leading-tight text-surface">
                  Host your own campaign
                </p>
              </div>
              <p className="font-body text-[13.5px] leading-snug text-[#F3E4C3]">
                Create a new campaign-poll, invite your table, then open the
                calendar when ready.
              </p>
              <Link
                href="/new"
                className="block rounded-[6px] bg-wine border border-[#B68A2E66] text-center font-display text-sm font-semibold tracking-wide text-[#F6EFE0] py-[13px] px-7 shadow-sm hover:brightness-110 transition-all"
                style={{ background: "rgba(90,30,40,0.85)" }}
              >
                HOST A CAMPAIGN
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-2">
              <p className="font-body text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                Your Tables
              </p>
              <p className="font-body text-[15px] font-bold text-ink">
                {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} ·{" "}
                {hostedCount} hosted · {playerCount} player invite
                {playerCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </aside>

        {/* Campaign List */}
        <section className="flex min-w-0 flex-1 flex-col gap-[18px]">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h3 className="font-display text-lg font-bold text-ink">
                Your Campaigns
              </h3>
              <p className="font-body text-sm text-ink-soft">
                All tables you're part of. Hosted campaigns have a gold border.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-dm-gold bg-dm-gold/15 px-2.5 py-1 text-[11px] font-body font-bold text-dm-gold">
              <Crown className="h-3 w-3" /> Host
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-hairline/30 px-2.5 py-1 text-[11px] font-body font-bold text-ink-soft">
              <Users className="h-3 w-3" /> Player
            </span>
          </div>

          {campaigns.length === 0 ? (
            <p className="font-body text-sm text-ink-soft italic">
              No campaigns yet — host one or wait for an invite.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {campaigns.map((c) => {
                const isHost = roleById[c.id] === "creator";
                const memberCount = memberCounts[c.id] ?? 1;
                return (
                  <Link
                    key={c.id}
                    href={`/g/${c.slug}`}
                    className="block rounded-xl border bg-surface px-[18px] py-[18px] shadow-parchment transition-all hover:shadow-md"
                    style={
                      isHost
                        ? { borderColor: "#7A5A12", borderWidth: "1.5px" }
                        : { borderColor: "#D8C8AC", borderWidth: "1px" }
                    }
                  >
                    {isHost && (
                      <div className="mb-3 h-1 w-full rounded-full bg-dm-gold" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-base font-bold leading-tight text-ink">
                          {c.name}
                        </h4>
                        <p className="mt-1 font-body text-[13.5px] text-ink-soft">
                          {isHost
                            ? "You control invites and poll settings before the table votes."
                            : "Choose your availability for the next session."}
                        </p>
                      </div>
                      {isHost && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dm-gold/50 bg-dm-gold/10 px-2.5 py-1 text-[10px] font-body font-bold uppercase tracking-wide text-dm-gold">
                          <Crown className="h-3 w-3" /> Host
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-hairline/60 pt-3">
                      <span className="inline-flex items-center gap-1.5 font-body text-xs text-ink-soft">
                        <Users className="h-3.5 w-3.5" />
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-body text-xs text-ink-soft">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {c.phase === "live" ? "Voting open" : "Draft"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AccountChip({ user }: { user: User }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface py-1.5 pl-1.5 pr-3 text-xs text-ink-soft shadow-sm hover:bg-parchment transition-colors"
      >
        <Avatar src={user.avatarUrl} alt={user.displayName || user.email} size={22} />
        <span className="max-w-[160px] truncate font-body font-bold text-ink">
          {user.displayName || user.email}
        </span>
      </button>
    </form>
  );
}
