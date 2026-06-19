"use client";

import { useState } from "react";
import Image from "next/image";
import { VenetianMask } from "lucide-react";
import { Avatar } from "./Avatar";
import { Crest } from "./Crest";
import type { Member, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type MemberWithUser = Member & { user: User };

type Props = {
  /** Already sorted (DMs first). */
  members: MemberWithUser[];
  /** Whether a banner image is present (affects ring color for contrast). */
  hasBanner: boolean;
};

export function BannerParty({ members, hasBanner }: Props) {
  const [tooltip, setTooltip] = useState<{
    member: MemberWithUser;
    x: number;
    y: number;
  } | null>(null);

  return (
    <>
      <div className="flex items-center">
        {members.map((m, i) => {
          const label =
            m.user.characterName || m.user.displayName || m.user.email;
          return (
            <div
              key={m.userId}
              className="relative -mr-2.5 shrink-0 cursor-default transition-transform hover:z-50 hover:scale-110"
              style={{ zIndex: members.length - i }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  member: m,
                  x: rect.left + rect.width / 2,
                  y: rect.bottom,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <Avatar
                src={m.user.avatarUrl}
                alt={label}
                size={40}
                className={cn(
                  "ring-2",
                  hasBanner
                    ? m.isDm
                      ? "ring-dm-gold"
                      : "ring-white/40"
                    : m.isDm
                      ? "ring-dm-gold"
                      : "ring-hairline",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Fixed tooltip — escapes the banner's overflow-hidden, sits below avatar */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[60] w-44 rounded-lg border border-hairline bg-surface p-2.5 shadow-parchment"
          style={{
            left: tooltip.x,
            top: tooltip.y + 8,
            transform: "translateX(-50%)",
          }}
        >
          <div className="overflow-hidden rounded-md bg-parchment">
            {tooltip.member.user.avatarUrl ? (
              <Image
                src={tooltip.member.user.avatarUrl}
                alt={tooltip.member.user.characterName || ""}
                width={160}
                height={160}
                className="h-[150px] w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-[150px] w-full items-center justify-center">
                <Crest size={72} />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {tooltip.member.isDm && (
              <VenetianMask className="h-3.5 w-3.5 shrink-0 text-dm-gold" />
            )}
            <p className="truncate font-display text-sm font-bold text-ink">
              {tooltip.member.user.characterName ||
                tooltip.member.user.displayName ||
                tooltip.member.user.email}
            </p>
          </div>
          {tooltip.member.user.characterName &&
            tooltip.member.user.displayName && (
              <p className="truncate text-[11px] text-ink-soft">
                {tooltip.member.user.displayName}
              </p>
            )}
        </div>
      )}
    </>
  );
}
