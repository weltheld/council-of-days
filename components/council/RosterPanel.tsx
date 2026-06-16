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
  const dms = members.filter((m) => m.isDm);
  const party = members.filter((m) => !m.isDm);

  return (
    <aside className="flex flex-col gap-4 p-4 sm:p-5">
      {dms.length > 0 && (
        <div className="flex flex-col gap-2">
          {dms.map((dm) => (
            <div
              key={dm.userId}
              className="flex items-start gap-3 rounded-card border border-dm-gold/40 bg-dm-gold/10 p-3"
            >
              <Avatar
                src={dm.user.avatarUrl}
                alt={dm.user.characterName}
                size={56}
                ring="gold"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-ink leading-tight truncate">
                  {dm.user.characterName || dm.user.displayName || dm.user.email}
                </p>
                {dm.user.displayName && (
                  <p className="truncate text-[11px] text-ink-soft">
                    {dm.user.displayName}
                    {myUserId === dm.userId && " — you"}
                  </p>
                )}
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-display tracking-wider uppercase text-dm-gold">
                  <VenetianMask className="h-3.5 w-3.5 shrink-0" /> Dungeon Master
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="small-caps">The Party</p>

      <ul className="space-y-1.5">
        {party.map((m) => {
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
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
