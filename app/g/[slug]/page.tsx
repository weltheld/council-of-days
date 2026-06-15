import { redirect, notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { GroupViewClient } from "@/components/council/GroupViewClient";
import type {
  BackgroundScene,
  Group,
  Member,
  User,
  Vote,
  Weekday,
} from "@/lib/types";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/g/${slug}`);

  // Load the campaign. RLS blocks non-members, so a missing row means
  // either "doesn't exist" or "you're not a member" — same 404 for the user.
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!campaign) notFound();

  // Load members + votes in parallel; then fetch profiles in one batch.
  const [{ data: membersRows }, { data: votesRows }] = await Promise.all([
    supabase
      .from("campaign_members")
      .select("campaign_id, user_id, role, joined_at")
      .eq("campaign_id", campaign.id),
    supabase
      .from("votes")
      .select("*")
      .eq("campaign_id", campaign.id),
  ]);

  const memberUserIds = (membersRows ?? []).map((m) => m.user_id);
  const { data: profileRows } = memberUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, display_name, character_name, avatar_url")
        .in("id", memberUserIds)
    : { data: [] };
  const profileById = new Map(
    (profileRows ?? []).map((p) => [p.id, p] as const),
  );

  const users: User[] = [];
  const members: Member[] = [];
  for (const row of membersRows ?? []) {
    const p = profileById.get(row.user_id);
    if (!p) continue;
    users.push({
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      characterName: p.character_name,
      avatarUrl: p.avatar_url ?? undefined,
    });
    members.push({
      groupId: row.campaign_id,
      userId: row.user_id,
      role: row.role === "creator" ? "creator" : "participant",
      joinedAt: row.joined_at,
    });
  }

  // Make sure the current user is represented even if their profile hasn't
  // been backfilled (defensive — handle_new_user trigger should cover this).
  if (!users.find((u) => u.id === user.id)) {
    users.push({
      id: user.id,
      email: user.email ?? "",
      displayName: "",
      characterName: "",
    });
  }

  const group: Group = {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    note: campaign.note ?? undefined,
    creatorId: campaign.creator_id,
    dmId: campaign.creator_id,
    phase: campaign.phase,
    viableWeekdays: (campaign.viable_weekdays ?? []) as Weekday[],
    background: campaign.background as BackgroundScene,
    createdAt: campaign.created_at,
  };

  const votes: Vote[] = (votesRows ?? []).map((v) => ({
    groupId: v.campaign_id,
    userId: v.user_id,
    date: v.date,
    value: v.value,
  }));

  return (
    <GroupViewClient
      group={group}
      members={members.map((m) => ({
        ...m,
        user: users.find((u) => u.id === m.userId)!,
      }))}
      votes={votes}
      currentUser={{
        id: user.id,
        email: user.email ?? "",
        displayName:
          users.find((u) => u.id === user.id)?.displayName ?? "",
        characterName:
          users.find((u) => u.id === user.id)?.characterName ?? "",
        avatarUrl: users.find((u) => u.id === user.id)?.avatarUrl,
      }}
    />
  );
}
