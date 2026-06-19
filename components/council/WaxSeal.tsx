type Props = {
  /** Past session => wine seal with a check; otherwise gold seal with the table crest. */
  played: boolean;
  size?: number;
};

/**
 * A pressed wax seal marking a game session. Gold (with the table crest) for an
 * upcoming night; wine (with a check) for a night already played.
 */
export function WaxSeal({ played, size = 26 }: Props) {
  const inner = Math.round(size * 0.62);
  return (
    <span
      className="relative inline-grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: played
          ? "radial-gradient(circle at 38% 32%, #9c3346 0%, #7a2030 45%, #511521 100%)"
          : "radial-gradient(circle at 38% 32%, #e8c766 0%, #c9a84c 45%, #9c7d2c 100%)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3)",
      }}
      aria-hidden
    >
      {played ? (
        <svg width={inner} height={inner} viewBox="0 0 24 24">
          <path
            d="M6 12.5l3.5 3.5L18 8"
            fill="none"
            stroke="#f3d8dd"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width={inner} height={inner} viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="#5a4410"
            strokeWidth="1"
            opacity="0.55"
          />
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="none"
            stroke="#5a4410"
            strokeWidth="0.7"
            opacity="0.4"
          />
          <g fill="#5a4410" opacity="0.6">
            <circle cx="12" cy="3.5" r="1" />
            <circle cx="18" cy="6" r="1" />
            <circle cx="20.5" cy="12" r="1" />
            <circle cx="18" cy="18" r="1" />
            <circle cx="12" cy="20.5" r="1" />
            <circle cx="6" cy="18" r="1" />
            <circle cx="3.5" cy="12" r="1" />
            <circle cx="6" cy="6" r="1" />
          </g>
        </svg>
      )}
    </span>
  );
}
