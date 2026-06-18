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
    <aside className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <p className="small-caps">The Party</p>
      </div>

      <ul className="divide-y divide-hairline/50 overflow-hidden rounded-lg border border-hairline/60 bg-surface">
        {roster.map((m) => {
          const isMe = myUserId === m.userId;
          return (
            <li
              key={m.userId}
              className="flex items-center gap-2.5 px-2.5 py-1.5"
            >
              <Avatar src={m.user.avatarUrl} alt={m.user.characterName} size={30} />
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
