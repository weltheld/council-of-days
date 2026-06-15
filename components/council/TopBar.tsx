"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Crest } from "./Crest";
import { Avatar } from "./Avatar";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  groupName: string;
  subtitle: string;
  slug: string;
  currentUser?: User;
  isCreator: boolean;
  /** Show the settings cog (mobile-only trigger, also visible on small screens). */
  onOpenSettings?: () => void;
};

export function TopBar({
  groupName,
  subtitle,
  slug,
  currentUser,
  isCreator,
  onOpenSettings,
}: Props) {
  return (
    <header className="border-b border-ink/15 backdrop-blur-[1px]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Crest size={36} className="hidden sm:inline-flex" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base sm:text-2xl text-ink leading-tight">
            {groupName}
          </h1>
          <p className="mt-0.5 truncate text-[11px] sm:text-sm text-ink-soft">
            {subtitle}
          </p>
        </div>

        {isCreator && (
          <span className="hidden items-center gap-1.5 rounded-full border border-dm-gold/50 bg-dm-gold/10 px-2.5 py-1 text-[10px] font-display tracking-wider uppercase text-dm-gold sm:inline-flex">
            <Crown className="h-3 w-3" />
            Creator
          </span>
        )}

        {isCreator && (
          <Link
            href={`/g/${slug}/invite`}
            className="hidden text-sm font-display tracking-wider uppercase text-ink-soft hover:text-ink sm:inline"
          >
            Invite players
          </Link>
        )}

        {currentUser && (
          <SignedInAccount user={currentUser} className="hidden md:inline-flex" />
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface/70 text-ink-soft hover:bg-parchment hover:text-ink",
            )}
            aria-label="Poll settings"
            title="Poll settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M3 7l3.5 5L12 4l5.5 8L21 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
    </svg>
  );
}

function SignedInAccount({ user, className }: { user: User; className?: string }) {
  return (
    <div
      className={cn(
        "items-center gap-2 rounded-full border border-hairline bg-surface/70 py-1 pl-1 pr-3",
        className,
      )}
    >
      <Avatar src={user.avatarUrl} alt={user.displayName || user.email} size={28} />
      <span className="max-w-[180px] truncate text-xs text-ink-soft">
        {user.email}
      </span>
    </div>
  );
}
