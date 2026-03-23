function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-56 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-20 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="aspect-[4/3] animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
        </div>
      </section>

      <section className="space-y-4 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Loading() {
  return <DetailSkeleton />;
}
