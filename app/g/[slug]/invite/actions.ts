"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getServerSupabase,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";

export type SendInviteResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

export async function sendInviteAction(
  slug: string,
  rawEmail: string,
): Promise<SendInviteResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/g/${slug}/invite`);

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, slug, creator_id")
    .eq("slug", slug)
    .maybeSingle();
  if (campErr || !campaign) {
    return { ok: false, error: "Campaign not found." };
  }
  if (campaign.creator_id !== user.id) {
    return { ok: false, error: "Only the creator can invite." };
  }

  // Already a platform user? Link by user_id and skip the magic email
  // (they'll see the invitation next login).
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await supabase.from("invitations").insert({
      campaign_id: campaign.id,
      user_id: existingProfile.id,
      status: "sent",
    });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
    revalidatePath(`/g/${slug}/invite`);
    return { ok: true, emailed: false };
  }

  // New email — record the invitation and dispatch a magic-link email.
  const { error: insertErr } = await supabase.from("invitations").insert({
    campaign_id: campaign.id,
    email,
    status: "queued",
  });
  if (insertErr && !insertErr.message.includes("duplicate")) {
    return { ok: false, error: insertErr.message };
  }

  const admin = getServiceRoleSupabase();
  const { error: emailErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/g/${slug}`,
  });
  if (emailErr) {
    return { ok: false, error: emailErr.message };
  }

  await supabase
    .from("invitations")
    .update({ status: "sent" })
    .eq("campaign_id", campaign.id)
    .eq("email", email);

  revalidatePath(`/g/${slug}/invite`);
  return { ok: true, emailed: true };
}

export async function cancelInviteAction(slug: string, invitationId: string) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/g/${slug}/invite`);

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/g/${slug}/invite`);
  return { ok: true as const };
}
