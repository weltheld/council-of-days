"use client";

import { VenetianMask } from "lucide-react";
import { Avatar } from "./Avatar";
import type { Member, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type MemberWithUser = Member & { user: User };

type Props = {
  members: MemberWithUser[];
  myUserId: string | null;
};

export function RosterPanel({ members, myUserId }: Props) {
  // DMs first, then players — all in one list.
  const roster = [...members].sort((a, b) =>
    a.isDm === b.isDm ? 0 : a.isDm ? -1 : 1,
  );

  return (
    <aside className="flex flex-col gap-4 p-4 sm:p-5">
      <p className="small-caps">The Party</p>

      <ul className="space-y-1.5">
        {roster.map((m) => {
          const isMe = myUserId === m.userId;
          return (
            <li
              key={m.userId}
              className={cn(
                "flex items-center gap-3 rounded-md border border-hairline/60 bg-surface px-2.5 py-2 shadow-sm",
              )}
            >
              <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink leading-tight">
                  {m.user.characterName}
                </p>
                <p className="truncate text-[11px] text-ink-soft">
                  {m.user.displayName}
                  {isMe && " — you"}
                </p>
              </div>
              {m.isDm && (
                <span
                  title="Dungeon Master"
                  aria-label="Dungeon Master"
                  className="inline-flex shrink-0"
                >
                  <VenetianMask className="h-4 w-4 text-dm-gold" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
