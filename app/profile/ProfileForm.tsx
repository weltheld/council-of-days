"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { ParchmentCard } from "@/components/council/ParchmentCard";
import { Crest } from "@/components/council/Crest";
import { Avatar } from "@/components/council/Avatar";
import { StageBackdrop } from "@/components/council/StageBackdrop";
import { TextField } from "@/components/council/TextField";
import { WaxButton } from "@/components/council/WaxButton";
import { ImageCropper } from "@/components/council/ImageCropper";
import { updateProfileAction, uploadAvatarAction } from "./actions";

const PORTRAITS = [
  "/images/avatar-mara.png",
  "/images/avatar-torgrim.png",
  "/images/avatar-sylvara.png",
  "/images/avatar-alaric.png",
  "/images/avatar-nyx.png",
  "/images/avatar-aldous.png",
];

type Initial = {
  character_name: string;
  display_name: string;
  avatar_url: string | null;
};

export function ProfileForm({
  email,
  initial,
}: {
  email: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [character, setCharacter] = useState(initial.character_name);
  const [display, setDisplay] = useState(initial.display_name);
  const [avatar, setAvatar] = useState<string>(
    initial.avatar_url ?? PORTRAITS[3],
  );
  const [showError, setShowError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setServerError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setServerError("Image must be 5 MB or smaller.");
      return;
    }
    setServerError(null);
    setCropFile(file);
  }

  async function uploadCropped(blob: Blob) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "avatar.jpg");
      const result = await uploadAvatarAction(fd);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setAvatar(result.url);
      setCropFile(null);
    } finally {
      setUploading(false);
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!character.trim() || !display.trim()) {
      setShowError(true);
      return;
    }
    startTransition(async () => {
      const result = await updateProfileAction({
        character_name: character,
        display_name: display,
        avatar_url: avatar,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.push(result.nextHref);
      router.refresh();
    });
  }

  return (
    <StageBackdrop>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          round
          aspect={1}
          viewWidth={256}
          outputWidth={512}
          title="Position your portrait"
          onCancel={() => setCropFile(null)}
          onConfirm={uploadCropped}
        />
      )}
      <ParchmentCard className="w-full max-w-[560px] p-7 sm:p-10">
        <header className="flex flex-col items-center text-center gap-3">
          <Crest size={56} />
          <p className="small-caps">Council of Days</p>
          <h1 className="font-display text-3xl text-ink">
            Take your seat at the table
          </h1>
          <p className="text-ink-soft max-w-[42ch]">
            Signed in as{" "}
            <span className="font-display text-ink">{email}</span>. Tell the
            council who you are.
          </p>
        </header>

        <form onSubmit={onSave} className="mt-7 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar src={avatar} alt={character || "Adventurer"} size={96} ring="gold" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PORTRAITS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`h-10 w-10 rounded-full overflow-hidden border ${avatar === p ? "border-dm-gold ring-2 ring-dm-gold" : "border-hairline"}`}
                  aria-label={`Choose portrait ${p}`}
                >
                  <Avatar src={p} alt="portrait" size={40} />
                </button>
              ))}
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPhoto}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface/60 px-3 py-1.5 text-xs font-display tracking-wider uppercase text-ink hover:bg-parchment disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload a photo"}
            </button>
            <p className="small-caps">Choose a portrait or upload your own</p>
          </div>

          <TextField
            label="Character name"
            placeholder="Alaric the Gray"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            error={
              showError && !character.trim()
                ? "A character name is required to take a seat at the table."
                : undefined
            }
          />
          <TextField
            label="Your name"
            placeholder="Felix Hoge"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            error={
              showError && !display.trim()
                ? "Your name is required so the party can address you."
                : undefined
            }
          />
          <p className="text-xs text-ink-soft text-center">
            Both fields are required to join a group.
          </p>

          {serverError && (
            <p className="rounded-md border border-vote-no/40 bg-vote-no/10 px-3 py-2 text-xs text-vote-no">
              {serverError}
            </p>
          )}

          <WaxButton type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </WaxButton>
        </form>
      </ParchmentCard>
    </StageBackdrop>
  );
}
