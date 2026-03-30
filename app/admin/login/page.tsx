import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary, getServerLocale } from "@/lib/get-dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AdminLoginPage() {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);

  if (await isAdminAuthenticated()) {
    redirect("/admin/listings");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-amber-400">{t.adminLogin.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t.adminLogin.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.adminLogin.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher initialLocale={locale} />
          </div>
        </div>
      </header>

      <section
        id="admin-login-section"
        data-automation="admin-login-section"
        className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">{t.adminPage.loginHint}</p>
        <AdminLoginForm />
      </section>
    </div>
  );
}
