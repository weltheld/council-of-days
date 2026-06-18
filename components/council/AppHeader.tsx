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
    <header className={hasBanner ? "relative overflow-hidden" : "border-b border-hairline"}>
      {hasBanner && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Strong gradient at top for nav bar, fades out in the middle, strengthens again at bottom for campaign name */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-black/70" />
        </>
      )}

      <div className={`relative mx-auto flex max-w-[1440px] flex-col px-4 sm:px-8 ${hasBanner ? "h-36" : ""}`}>
        {/* Nav row — always at the top */}
        <div className="flex h-16 items-center gap-3">
          {hasBanner ? (
            /* Frosted pill badge — compact app identity on banner */
            <Link
              href="/home"
              aria-label="Council of Days — home"
              className="flex min-w-0 flex-1 items-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 py-1 pl-1 pr-3 backdrop-blur-sm">
                <Crest size={26} />
                <span className="truncate font-body text-[11px] font-semibold uppercase tracking-widest text-white/80">
                  Council of Days
                </span>
              </span>
            </Link>
          ) : (
            /* Default full-size logo + wordmark */
            <Link
              href="/home"
              aria-label="Council of Days — home"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <Crest size={38} />
              <span className="truncate font-display text-base font-bold text-ink sm:text-xl">
                Council of Days
              </span>
            </Link>
          )}

          <ProfileDialog
            firstName={firstName}
            email={email}
            characterName={characterName}
            displayName={displayName}
            avatarUrl={avatarUrl}
            variant={hasBanner ? "banner" : "default"}
          />

          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${
                hasBanner
                  ? "border-white/30 bg-black/25 text-surface hover:bg-black/40"
                  : "border-hairline bg-surface text-ink-soft hover:bg-parchment hover:text-ink"
              }`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Campaign name — anchored to bottom when banner is present */}
        {hasBanner && campaignName && (
          <div className="flex flex-1 items-end pb-3">
            <h1 className="truncate border-l-2 border-dm-gold pl-3 font-display text-xl font-bold text-surface drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
              {campaignName}
            </h1>
          </div>
        )}
      </div>
    </header>
  );
}
