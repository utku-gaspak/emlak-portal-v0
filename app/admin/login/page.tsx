import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/listings");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Management Access</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your credentials to access the dashboard.</p>
      </header>

      <section id="admin-login-section" data-automation="admin-login-section" className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">This area is hidden from regular visitors.</p>
        <AdminLoginForm />
      </section>
    </div>
  );
}
