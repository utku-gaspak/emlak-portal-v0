function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="aspect-[4/3] animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 py-10 text-center">
          <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 w-full max-w-2xl animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-14 w-full max-w-5xl animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>

      <section className="space-y-5 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-72 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
