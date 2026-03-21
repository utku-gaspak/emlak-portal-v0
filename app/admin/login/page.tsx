import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/get-dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AdminLoginPage() {
  const t = getDictionary();

  if (await isAdminAuthenticated()) {
    redirect("/admin/listings");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{t.adminLogin.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.adminLogin.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{t.adminLogin.description}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <section id="admin-login-section" data-automation="admin-login-section" className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">{t.adminPage.loginHint}</p>
        <AdminLoginForm />
      </section>
    </div>
  );
}
