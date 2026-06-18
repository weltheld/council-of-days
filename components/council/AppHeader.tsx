import Link from "next/link";
import { LogOut } from "lucide-react";
import { Crest } from "./Crest";
import { ProfileDialog } from "./ProfileDialog";
import { signOutAction } from "@/app/auth/actions";

type Props = {
  firstName: string;
  email: string;
  characterName: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  campaignName?: string;
};

export function AppHeader({
  firstName,
  email,
  characterName,
  displayName,
  avatarUrl,
  bannerUrl,
  campaignName,
}: Props) {
  const hasBanner = !!bannerUrl;

  return (
    <header className={hasBanner ? "bg-parchment" : "border-b border-hairline"}>
      {/* Nav row — identical on all pages */}
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-8"
           style={hasBanner ? { borderBottom: "1px solid rgba(122,90,18,0.18)" } : {}}>
        <Link
          href="/home"
          aria-label="Council of Days — home"
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <Crest size={36} />
          <span className="truncate font-display text-base font-bold text-ink sm:text-xl">
            Council of Days
          </span>
        </Link>

        <ProfileDialog
          firstName={firstName}
          email={email}
          characterName={characterName}
          displayName={displayName}
          avatarUrl={avatarUrl}
        />

        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink-soft shadow-sm hover:bg-parchment hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Banner card — only on campaign pages */}
      {hasBanner && campaignName && (
        <div className="mx-auto max-w-[1440px] px-4 pb-4 sm:px-8">
          <div className="relative h-28 overflow-hidden rounded-xl shadow-parchment sm:h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/65" />
            <div className="absolute inset-x-0 bottom-0 flex items-end px-5 pb-4">
              <h1 className="truncate border-l-2 border-dm-gold pl-3 font-display text-xl font-bold text-surface drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
                {campaignName}
              </h1>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
