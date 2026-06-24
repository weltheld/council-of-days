import { Crest } from "./Crest";
import { cn } from "@/lib/utils";

type Props = {
  /** Caption shown under the crest. */
  label?: string;
  /** Fill the viewport (route-level fallback) vs. just the local area. */
  fullScreen?: boolean;
  className?: string;
};

/**
 * The app's branded loading indicator: the gold council crest rotating
 * slowly with a pulsing caption. Used by route-level `loading.tsx`
 * fallbacks and anywhere an async area needs a spinner.
 */
export function Loader({
  label = "Gathering the council…",
  fullScreen = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-screen bg-parchment" : "min-h-[55vh]",
        className,
      )}
    >
      <Crest size={56} className="animate-crest-spin" />
      <p className="small-caps animate-loader-pulse">{label}</p>
    </div>
  );
}
