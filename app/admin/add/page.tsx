import Link from "next/link";
import { redirect } from "next/navigation";
import { AddListingForm } from "@/components/AddListingForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/get-dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AddListingPage() {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-amber-400">{t.adminPage.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t.adminPage.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.adminPage.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <section id="admin-form-section" data-automation="admin-form-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm text-slate-700 dark:text-slate-300">{t.adminPage.authenticated}</p>
          <AdminLogoutButton className="border-slate-200 bg-slate-700 text-white hover:bg-slate-900 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" />
        </div>

        <AddListingForm />
      </section>

        <div className="flex flex-wrap gap-3">
        <Link
          id="back-to-list-button"
          data-automation="back-to-list-button"
          href="/admin/listings"
          className="inline-flex text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-amber-400 dark:hover:text-amber-300"
        >
          {t.adminPage.backToListings}
        </Link>
        <Link
          id="back-home-link"
          data-automation="back-home-link"
          href="/"
          className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t.adminPage.backToSite}
        </Link>
      </div>
    </div>
  );
}
