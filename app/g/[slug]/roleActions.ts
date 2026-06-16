"use server";

import {
  getServerSupabase,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";

export type SetMemberDmResult = { ok: true } | { ok: false; error: string };

/**
 * Set whether a member is a Dungeon Master. Creator-only; the write goes
 * through the service role so it isn't blocked by RLS.
 */
export async function setMemberDmAction(
  campaignId: string,
  userId: string,
  isDm: boolean,
): Promise<SetMemberDmResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("creator_id")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign || campaign.creator_id !== user.id) {
    return { ok: false, error: "Only the creator can change roles." };
  }

  const admin = getServiceRoleSupabase();
  const { error } = await admin
    .from("campaign_members")
    .update({ is_dm: isDm })
    .eq("campaign_id", campaignId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
