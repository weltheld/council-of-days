import { cn } from "@/lib/utils";

type CrestProps = {
  size?: number;
  className?: string;
};

export function Crest({ size = 48, className }: CrestProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full shadow-crest",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id="crest-gold" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#F2D079" />
            <stop offset="55%" stopColor="#B68A2E" />
            <stop offset="100%" stopColor="#6B4F12" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#crest-gold)" stroke="#2B2118" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#2B2118" strokeOpacity="0.35" strokeWidth="0.8" />
        <path
          d="M32 14 L40 26 L52 28 L43 38 L46 52 L32 46 L18 52 L21 38 L12 28 L24 26 Z"
          fill="#6B2230"
          stroke="#2B2118"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="34" r="3" fill="#F3E4C3" />
      </svg>
    </span>
  );
}
