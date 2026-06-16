import Link from "next/link";
import { LogOut } from "lucide-react";
import { Crest } from "./Crest";
import { Avatar } from "./Avatar";
import { signOutAction } from "@/app/auth/actions";

type Props = {
  firstName: string;
  avatarUrl?: string;
};

/**
 * Shared top header used identically on the home and calendar pages:
 * logo + wordmark (links home), the signed-in player's portrait and first
 * name, and a sign-out button. Fixed height so both pages match.
 */
export function AppHeader({ firstName, avatarUrl }: Props) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-8">
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

        <Link
          href="/profile"
          title="Edit profile"
          className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-3 shadow-sm hover:bg-parchment"
        >
          <Avatar src={avatarUrl} alt={firstName} size={30} />
          <span className="max-w-[100px] truncate font-body text-sm font-bold text-ink sm:max-w-[160px]">
            {firstName}
          </span>
        </Link>

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
    </header>
  );
}
