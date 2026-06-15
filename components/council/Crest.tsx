import Image from "next/image";
import { cn } from "@/lib/utils";

type CrestProps = {
  size?: number;
  className?: string;
};

export function Crest({ size = 48, className }: CrestProps) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/images/crest.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(43,33,24,0.25)]"
        unoptimized
        priority
      />
    </span>
  );
}
