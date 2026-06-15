"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

export type UpdateProfileInput = {
  character_name: string;
  display_name: string;
  avatar_url: string | null;
};

export type UpdateProfileResult =
  | { ok: true; nextHref: string }
  | { ok: false; error: string };

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const character = input.character_name.trim();
  const display = input.display_name.trim();
  if (!character || !display) {
    return {
      ok: false,
      error: "Character name and your name are both required.",
    };
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      character_name: character,
      display_name: display,
      avatar_url: input.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Where to go after save? If they're already a member of a campaign,
  // send them there. Otherwise, the campaign-creation wizard.
  // Two queries beats a fragile PostgREST join here.
  const { data: membership } = await supabase
    .from("campaign_members")
    .select("campaign_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let slug: string | null = null;
  if (membership?.campaign_id) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("slug")
      .eq("id", membership.campaign_id)
      .maybeSingle();
    slug = campaign?.slug ?? null;
  }

  revalidatePath("/profile");
  return { ok: true, nextHref: slug ? `/g/${slug}` : "/new" };
}
