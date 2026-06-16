import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, LogOut } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { Crest } from "@/components/council/Crest";
import { Avatar } from "@/components/council/Avatar";
import { cn } from "@/lib/utils";
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
            .select("id, slug, name, phase, creator_id, banner_url, created_at")
            .in("id", campaignIds)
        ).data ?? []
      : [];

  // Members (with portraits) per campaign.
  type Portrait = { userId: string; name: string; avatarUrl?: string };
  const membersByCampaign: Record<string, Portrait[]> = {};
  if (campaignIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("campaign_members")
      .select("campaign_id, user_id")
      .in("campaign_id", campaignIds);

    const memberUserIds = Array.from(
      new Set((allMembers ?? []).map((m) => m.user_id)),
    );
    const { data: memberProfiles } = memberUserIds.length
      ? await supabase
          .from("profiles")
          .select("id, character_name, display_name, avatar_url")
          .in("id", memberUserIds)
      : { data: [] };
    const profileById = new Map(
      (memberProfiles ?? []).map((p) => [p.id, p] as const),
    );

    const creatorById = Object.fromEntries(
      campaigns.map((c) => [c.id, c.creator_id]),
    );
    for (const m of allMembers ?? []) {
      const p = profileById.get(m.user_id);
      (membersByCampaign[m.campaign_id] ??= []).push({
        userId: m.user_id,
        name: p?.character_name || p?.display_name || "Adventurer",
        avatarUrl: p?.avatar_url ?? undefined,
      });
    }
    // Put the owner/DM first in each portrait row.
    for (const id of Object.keys(membersByCampaign)) {
      membersByCampaign[id].sort((a, b) =>
        a.userId === creatorById[id] ? -1 : b.userId === creatorById[id] ? 1 : 0,
      );
    }
  }

  const roleById = Object.fromEntries(
    (memberships ?? []).map((m) => [m.campaign_id, m.role]),
  );

  const hostedCampaigns = campaigns.filter(
    (c) => roleById[c.id] === "creator",
  );
  const playerCampaigns = campaigns.filter(
    (c) => roleById[c.id] !== "creator",
  );

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
              <p className="font-body text-sm leading-snug text-ink-soft sm:text-[15px]">
                You signed in by email link. Choose a campaign to vote, or start
                hosting a new table.
              </p>
            </div>

            {/* Host CTA — prominent only when the user has no campaigns yet. */}
            {campaigns.length === 0 ? (
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
            ) : (
              <Link
                href="/new"
                className="inline-flex items-center gap-2 self-start rounded-md border border-hairline bg-surface/60 px-3 py-2 font-display text-xs font-semibold tracking-wider uppercase text-ink-soft hover:bg-parchment hover:text-ink transition-colors"
              >
                <Crown className="h-3.5 w-3.5 text-dm-gold" />
                Host a new campaign
              </Link>
            )}
          </div>
        </aside>

        {/* Campaign List */}
        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <h3 className="font-display text-lg font-bold text-ink">
            Your Campaign Calendars
          </h3>

          {campaigns.length === 0 ? (
            <p className="font-body text-sm text-ink-soft italic">
              No campaigns yet — host one or wait for an invite.
            </p>
          ) : (
            <>
              {hostedCampaigns.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    Hosted by you
                  </p>
                  <div className="flex flex-col gap-4">
                    {hostedCampaigns.map((c) => (
                      <CampaignCard
                        key={c.id}
                        slug={c.slug}
                        name={c.name}
                        bannerUrl={c.banner_url}
                        isHost
                        members={membersByCampaign[c.id] ?? []}
                      />
                    ))}
                  </div>
                </div>
              )}

              {playerCampaigns.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    You&apos;re a player
                  </p>
                  <div className="flex flex-col gap-4">
                    {playerCampaigns.map((c) => (
                      <CampaignCard
                        key={c.id}
                        slug={c.slug}
                        name={c.name}
                        bannerUrl={c.banner_url}
                        isHost={false}
                        members={membersByCampaign[c.id] ?? []}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function CampaignCard({
  slug,
  name,
  bannerUrl,
  isHost,
  members,
}: {
  slug: string;
  name: string;
  bannerUrl: string | null;
  isHost: boolean;
  members: { userId: string; name: string; avatarUrl?: string }[];
}) {
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;
  const nameClass = bannerUrl
    ? "text-surface drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
    : "text-ink";
  return (
    <div
      className="group relative min-h-[160px] overflow-hidden rounded-xl border bg-surface shadow-parchment transition-all hover:shadow-md"
      style={
        isHost
          ? { borderColor: "#7A5A12", borderWidth: "1.5px" }
          : { borderColor: "#D8C8AC", borderWidth: "1px" }
      }
    >
      {/* Banner background (only when one is set). The fallback is simply the
          card's normal surface colour. */}
      {bannerUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/45" />
        </>
      )}

      {/* Full-card navigation target */}
      <Link
        href={`/g/${slug}`}
        aria-label={`Open ${name}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex min-h-[160px] flex-col justify-between gap-3 p-[18px]">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`font-display text-lg font-bold leading-tight ${nameClass}`}
          >
            {name}
          </h4>
          {isHost && (
            <span
              className={cn(
                "pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-body font-bold uppercase tracking-wide",
                bannerUrl
                  ? "border-dm-gold/60 bg-ink/40 text-dm-gold backdrop-blur-sm"
                  : "border-dm-gold/50 bg-dm-gold/10 text-dm-gold",
              )}
            >
              <Crown className="h-3 w-3" /> Host
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {shown.map((m) => (
              <span
                key={m.userId}
                className={cn(
                  "inline-block rounded-full ring-2",
                  bannerUrl ? "ring-ink/50" : "ring-surface",
                )}
                title={m.name}
              >
                <Avatar src={m.avatarUrl} alt={m.name} size={48} />
              </span>
            ))}
          </div>
          {extra > 0 && (
            <span
              className={cn(
                "font-body text-sm font-semibold",
                bannerUrl ? "text-surface/90" : "text-ink-soft",
              )}
            >
              +{extra}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountChip({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface py-1.5 pl-1.5 pr-3 text-xs text-ink-soft shadow-sm hover:bg-parchment transition-colors"
        title="Edit profile"
      >
        <Avatar src={user.avatarUrl} alt={user.displayName || user.email} size={22} />
        <span className="max-w-[160px] truncate font-body font-bold text-ink">
          {user.displayName || user.email}
        </span>
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-ink-soft shadow-sm hover:bg-parchment transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
