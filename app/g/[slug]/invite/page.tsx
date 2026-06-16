import { notFound, redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { InvitePageClient } from "./InvitePageClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/g/${slug}/invite`);

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, slug, name, creator_id, background")
    .eq("slug", slug)
    .maybeSingle();
  if (!campaign) notFound();
  if (campaign.creator_id !== user.id) {
    // Only the creator can manage invites — boot non-creators back into
    // the campaign view rather than expose a forbidden screen.
    redirect(`/g/${slug}`);
  }

  const [{ data: invitations }, { data: members }] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, email, user_id, status")
      .eq("campaign_id", campaign.id),
    supabase
      .from("campaign_members")
      .select("user_id, role")
      .eq("campaign_id", campaign.id),
  ]);

  // Look up profile rows for everyone referenced above in one shot.
  const userIds = new Set<string>();
  for (const m of members ?? []) userIds.add(m.user_id);
  for (const i of invitations ?? []) if (i.user_id) userIds.add(i.user_id);
  const { data: profiles } = userIds.size
    ? await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url")
        .in("id", Array.from(userIds))
    : { data: [] };
  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p] as const),
  );

  return (
    <InvitePageClient
      slug={campaign.slug}
      name={campaign.name}
      background={campaign.background}
      members={(members ?? []).map((m) => {
        const p = profileById.get(m.user_id);
        return {
          userId: m.user_id,
          role: m.role,
          displayName: p?.display_name ?? "",
          email: p?.email ?? "",
          avatarUrl: p?.avatar_url ?? undefined,
        };
      })}
      invitations={(invitations ?? []).map((i) => {
        const p = i.user_id ? profileById.get(i.user_id) : undefined;
        return {
          id: i.id,
          email: i.email ?? p?.email ?? "",
          displayName: p?.display_name ?? null,
          avatarUrl: p?.avatar_url ?? undefined,
          status: i.status,
        };
      })}
    />
  );
}
