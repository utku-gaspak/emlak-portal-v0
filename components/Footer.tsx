import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export function Footer() {
  const isAuthenticated = isAdminAuthenticated();
  const href = isAuthenticated ? "/admin/listings" : "/admin/login";

  return (
    <footer className="mt-14 border-t border-slate-200/80 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Premium real estate listings, built for fast browsing and reliable automation.</p>
        <Link
          id="admin-footer-link"
          data-automation="admin-footer-link"
          href={href}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          {isAuthenticated ? "Go to Dashboard" : "Admin Portal"}
        </Link>
      </div>
    </footer>
  );
}
