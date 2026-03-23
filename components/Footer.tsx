import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDictionary } from "@/lib/get-dictionary";

export async function Footer() {
  const t = await getDictionary();
  const isAuthenticated = await isAdminAuthenticated();
  const href = isAuthenticated ? "/admin/listings" : "/admin/login";

  return (
    <footer className="mt-14 border-t border-slate-200/80 py-8 dark:border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.siteHeader.brandName}</p>
        <Link
          id="admin-footer-link"
          data-automation="admin-footer-link"
          href={href}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {isAuthenticated ? t.siteHeader.dashboard : t.siteHeader.adminPortal}
        </Link>
      </div>
    </footer>
  );
}
