import { Crest } from "@/components/council/Crest";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-parchment">
      {/* Header (matches AppHeader height/layout) */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-8">
          <Crest size={38} className="animate-loader-pulse" />
          <div className="skeleton h-5 w-40" />
          <div className="flex-1" />
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-4 pb-12 pt-7 sm:px-9 sm:pt-[30px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-9 w-44" />
        </div>

        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="min-h-[160px] overflow-hidden rounded-xl border border-hairline bg-surface p-[18px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="skeleton h-6 w-44" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
              <div className="mt-12 flex -space-x-3">
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="skeleton h-12 w-12 rounded-full ring-2 ring-surface"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
