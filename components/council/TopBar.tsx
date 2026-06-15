"use client";

import Link from "next/link";
import { Crest } from "./Crest";
import { WaxButton } from "./WaxButton";

type Props = {
  groupName: string;
  subtitle: string;
  slug: string;
};

export function TopBar({ groupName, subtitle, slug }: Props) {
  return (
    <header className="border-b border-hairline bg-parchment-texture">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-8 sm:py-4">
        <Crest size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg sm:text-2xl text-ink leading-none">
            {groupName}
          </h1>
          <p className="mt-1 truncate text-xs sm:text-sm text-ink-soft">{subtitle}</p>
        </div>
        <Link
          href={`/g/${slug}/invite`}
          className="hidden text-sm font-display tracking-wider uppercase text-ink-soft hover:text-ink sm:inline"
        >
          Invite link
        </Link>
        <WaxButton size="sm" onClick={() => {}}>
          Invite players
        </WaxButton>
      </div>
    </header>
  );
}
