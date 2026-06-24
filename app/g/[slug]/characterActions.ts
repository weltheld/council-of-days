"use server";

import {
  getServerSupabase,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";

export type LibImage = { id: string; url: string };

export type UploadImageResult =
  | { ok: true; image: LibImage }
  | { ok: false; error: string };

/**
 * Upload a character portrait into the user's reusable image library.
 * The file lands in the existing `avatars` bucket under {user_id}/…,
 * and a row is recorded in user_images so it can be re-picked later.
 */
export async function uploadCharacterImageAction(
  formData: FormData,
): Promise<UploadImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No image was provided." };
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const admin = getServiceRoleSupabase();
  const path = `${user.id}/char-${Date.now()}.jpg`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);

  const { data: row, error: insertError } = await admin
    .from("user_images")
    .insert({ user_id: user.id, url: publicUrl })
    .select("id, url")
    .single();
  if (insertError || !row) {
    return {
      ok: false,
      error: insertError?.message ?? "Could not save the image.",
    };
  }

  return { ok: true, image: { id: row.id, url: row.url } };
}

export type ListImagesResult =
  | { ok: true; images: LibImage[] }
  | { ok: false; error: string };

/** The current user's image library, newest first. */
export async function listMyImagesAction(): Promise<ListImagesResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data, error } = await supabase
    .from("user_images")
    .select("id, url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, images: data ?? [] };
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

/**
 * Remove an image from the user's library. Leaves the storage object and
 * any campaign that already references the URL untouched.
 */
export async function deleteUserImageAction(
  id: string,
): Promise<SimpleResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("user_images")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Permanently delete one of the user's portraits *everywhere*: the storage
 * object (only within their own avatars folder), any image-library rows, and
 * every reference to it as a profile or per-campaign avatar. Anything that
 * pointed at it falls back to the crest. Scoped to the caller's own data.
 */
export async function deletePortraitEverywhereAction(
  url: string,
): Promise<SimpleResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const admin = getServiceRoleSupabase();

  // Remove the underlying file, but only if it lives in this user's folder
  // ({user_id}/…) — never touch anyone else's storage.
  const marker = "/storage/v1/object/public/avatars/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(url.slice(idx + marker.length));
    if (path.startsWith(`${user.id}/`)) {
      await admin.storage.from("avatars").remove([path]);
    }
  }

  // Drop any library rows, and clear the URL wherever it's used as an avatar.
  await admin.from("user_images").delete().eq("user_id", user.id).eq("url", url);
  await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)
    .eq("avatar_url", url);
  await admin
    .from("campaign_members")
    .update({ avatar_url: null })
    .eq("user_id", user.id)
    .eq("avatar_url", url);

  return { ok: true };
}

export type SetCharacterInput = {
  characterName: string;
  avatarUrl: string | null;
};

/**
 * Set the current user's per-campaign character name + portrait. Goes
 * through the service role AFTER verifying membership, and updates ONLY
 * the character fields — never role / is_dm — so it can't be used to
 * self-promote.
 */
export async function setCampaignCharacterAction(
  campaignId: string,
  input: SetCharacterInput,
): Promise<SimpleResult> {
  const name = input.characterName.trim();
  if (!name) return { ok: false, error: "A character name is required." };

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: membership } = await supabase
    .from("campaign_members")
    .select("user_id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return { ok: false, error: "You are not a member of this campaign." };
  }

  const admin = getServiceRoleSupabase();
  const { error } = await admin
    .from("campaign_members")
    .update({ character_name: name, avatar_url: input.avatarUrl })
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
