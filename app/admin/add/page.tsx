import Link from "next/link";
import { redirect } from "next/navigation";
import { AddListingForm } from "@/components/AddListingForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/locale";

export default async function AddListingPage() {
  const t = getDictionary();

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{t.adminPage.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.adminPage.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.adminPage.description}</p>
      </header>

      <section id="admin-form-section" data-automation="admin-form-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-700">{t.adminPage.authenticated}</p>
          <AdminLogoutButton className="bg-slate-700 text-white hover:bg-slate-900 hover:text-white" />
        </div>

        <AddListingForm />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link id="back-to-list-button" data-automation="back-to-list-button" href="/admin/listings" className="inline-flex text-sm font-medium text-brand-700 hover:text-brand-900">
          Back to List
        </Link>
        <Link id="back-home-link" data-automation="back-home-link" href="/" className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-700">
          Back to site
        </Link>
      </div>
    </div>
  );
}
