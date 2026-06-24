import { Crest } from "@/components/council/Crest";

export default function GroupLoading() {
  return (
    <div className="relative min-h-screen bg-parchment">
      {/* Header (matches AppHeader) */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-8">
          <Crest size={38} className="animate-loader-pulse" />
          <div className="skeleton h-5 w-40" />
          <div className="flex-1" />
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
      </header>

      {/* Banner card */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-5">
        <div className="skeleton h-32 w-full rounded-xl sm:h-40" />
      </div>

      {/* Body: sidebar + calendar grid */}
      <main className="mx-auto grid w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-hairline/70 lg:block">
          <div className="flex flex-col gap-4 p-5">
            <div className="skeleton h-28 w-full rounded-card" />
            <div className="skeleton h-16 w-full rounded-card" />
            <div className="skeleton h-40 w-full rounded-card" />
          </div>
        </aside>

        <section className="flex flex-col gap-3 p-4 sm:p-5">
          {/* Month nav row */}
          <div className="flex items-center gap-x-4">
            <div className="skeleton h-9 w-9" />
            <div className="skeleton h-7 w-44" />
            <div className="skeleton h-9 w-9" />
            <div className="flex-1" />
            <div className="skeleton h-8 w-28" />
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton mx-auto h-3 w-8" />
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="skeleton h-[78px] rounded-md" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
