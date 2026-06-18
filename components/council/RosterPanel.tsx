"use client";

import { useState } from "react";
import Image from "next/image";
import { VenetianMask } from "lucide-react";
import { Avatar } from "./Avatar";
import { Crest } from "./Crest";
import type { Member, User } from "@/lib/types";

type MemberWithUser = Member & { user: User };

type Props = {
  members: MemberWithUser[];
  myUserId: string | null;
};

export function RosterPanel({ members, myUserId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const roster = [...members].sort((a, b) =>
    a.isDm === b.isDm ? 0 : a.isDm ? -1 : 1,
  );

  return (
    <aside className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <p className="small-caps">The Party</p>
      </div>

      <ul className="divide-y divide-hairline/50 overflow-hidden rounded-lg border border-hairline/60 bg-surface">
        {roster.map((m) => {
          const isMe = myUserId === m.userId;
          const isHovered = hoveredId === m.userId;
          return (
            <li
              key={m.userId}
              className="relative flex items-center gap-2.5 px-2.5 py-1.5"
            >
              {/* Avatar with hover trigger */}
              <div
                className="shrink-0"
                onMouseEnter={() => setHoveredId(m.userId)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={30} />

                {/* Tooltip card — pops up above the avatar */}
                {isHovered && (
                  <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-36 rounded-lg border border-hairline bg-surface p-2.5 shadow-parchment">
                    <div className="overflow-hidden rounded-md bg-parchment">
                      {m.user.avatarUrl ? (
                        <Image
                          src={m.user.avatarUrl}
                          alt={m.user.characterName}
                          width={120}
                          height={120}
                          className="h-[120px] w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-[120px] w-full items-center justify-center">
                          <Crest size={60} />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate font-display text-sm font-bold text-ink">
                      {m.user.characterName}
                    </p>
                    {m.user.displayName && (
                      <p className="truncate text-[11px] text-ink-soft">
                        {m.user.displayName}
                        {isMe && " (you)"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <p className="min-w-0 flex-1 truncate text-sm text-ink">
                <span className="font-medium">{m.user.characterName}</span>
                {m.user.displayName && (
                  <span className="text-ink-soft">
                    {" · "}
                    {m.user.displayName}
                    {isMe && " (you)"}
                  </span>
                )}
              </p>
              {m.isDm && (
                <span
                  title="Dungeon Master"
                  aria-label="Dungeon Master"
                  className="inline-flex shrink-0"
                >
                  <VenetianMask className="h-3.5 w-3.5 text-dm-gold" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
