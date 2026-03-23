import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white p-8 text-center shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-400">Gaspak Emlak</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
          Aradığınız ilan bulunamadı
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
          Aradığınız ilan kaldırılmış olabilir ya da artık yayında olmayabilir. Ana sayfadan güncel ilanlara göz atabilirsiniz.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
