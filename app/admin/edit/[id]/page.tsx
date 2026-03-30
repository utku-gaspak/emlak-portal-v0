import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { EditPhotoManager } from "@/components/EditPhotoManager";
import { PropertyForm } from "@/components/PropertyForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCategories } from "@/lib/categories";
import { getDictionary, getServerLocale } from "@/lib/get-dictionary";
import { getListingById } from "@/lib/listings-store";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type EditListingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const locale = await getServerLocale();
  const t = await getDictionary(locale);
  const categories = await getCategories();

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const resolvedParams = await params;
  const listing = await getListingById(resolvedParams.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-amber-400">{t.adminEditPage.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t.adminEditPage.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.adminEditPage.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher initialLocale={locale} />
          </div>
        </div>
      </header>

      <section id="admin-edit-form-section" data-automation="admin-edit-form-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t.adminPage.authenticated} İlan No: {listing.listingNo}
          </p>
          <AdminLogoutButton className="border-slate-200 bg-slate-700 text-white hover:bg-slate-900 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" />
        </div>

        <EditPhotoManager listingId={listing.id} listingTitle={listing.title} images={listing.images} />
        <PropertyForm mode="edit" initialData={listing} categories={categories} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          id="cancel-edit-button"
          data-automation="cancel-edit-button"
          href="/admin/listings"
          className="inline-flex text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-amber-400 dark:hover:text-amber-300"
        >
          {t.adminListings.cancel}
        </Link>
        <Link id="back-home-link" data-automation="back-home-link" href="/" className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          {t.adminPage.backHome}
        </Link>
      </div>
    </div>
  );
}
