"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LogOut, Settings2, UserPen } from "lucide-react";
import { Crest } from "./Crest";
import { Avatar } from "./Avatar";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";

type Props = {
  groupName: string;
  subtitle: string;
  slug: string;
  currentUser?: User;
  isCreator: boolean;
  /** "Creator" | "Player" shown under the account email. */
  roleLabel?: string;
  /** Show the settings cog (mobile-only trigger, also visible on small screens). */
  onOpenSettings?: () => void;
};

export function TopBar({
  groupName,
  subtitle,
  slug,
  currentUser,
  isCreator,
  roleLabel,
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
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] sm:text-sm text-ink-soft">
              {subtitle}
            </p>
          )}
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
          <SignedInAccount
            user={currentUser}
            roleLabel={roleLabel}
            className="hidden md:inline-flex"
          />
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink-soft shadow-sm hover:bg-parchment hover:text-ink",
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

function SignedInAccount({
  user,
  roleLabel,
  className,
}: {
  user: User;
  roleLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface py-1 pl-1 pr-3 shadow-sm hover:bg-parchment"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          src={user.avatarUrl}
          alt={user.displayName || user.email}
          size={28}
        />
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="max-w-[180px] truncate text-xs text-ink-soft">
            {user.email}
          </span>
          {roleLabel && (
            <span className="text-[10px] font-display uppercase tracking-wider text-dm-gold">
              {roleLabel}
            </span>
          )}
        </span>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-md border border-hairline bg-surface shadow-parchment"
          >
            <div className="border-b border-hairline/70 px-3 py-2">
              <p className="font-display text-sm text-ink truncate">
                {user.displayName || user.characterName || user.email}
              </p>
              <p className="text-[11px] text-ink-soft truncate">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <UserPen className="h-4 w-4 text-ink-soft" />
              Edit profile
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await signOutAction();
                })
              }
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-parchment disabled:opacity-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 text-ink-soft" />
              {pending ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
