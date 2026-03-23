"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Listing } from "@/lib/types";
import { formatListingPrice } from "@/lib/currency";
import { getListingImageSrc } from "@/lib/photo-path";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/context/TranslationContext";

type AdminListingsManagerProps = {
  listings: Listing[];
  currentPage: number;
  totalPages: number;
  totalListings: number;
  totalFeaturedListings: number;
  previousHref: string;
  nextHref: string;
};

export function AdminListingsManager({
  listings,
  currentPage,
  totalPages,
  totalListings,
  totalFeaturedListings,
  previousHref,
  nextHref
}: AdminListingsManagerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const [visibleListings, setVisibleListings] = useState(listings);
  const [featuredCount, setFeaturedCount] = useState(totalFeaturedListings);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featuredPendingIds, setFeaturedPendingIds] = useState<Record<string, boolean>>({});
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setVisibleListings(listings);
  }, [listings]);

  useEffect(() => {
    setFeaturedCount(totalFeaturedListings);
  }, [totalFeaturedListings]);

  const featuredById = useMemo(() => {
    return new Map(visibleListings.map((listing) => [listing.id, listing.isFeatured]));
  }, [visibleListings]);

  function openPublicListing(listingId: string) {
    window.open(`/property/${listingId}`, "_blank", "noopener,noreferrer");
  }

  function setListingFeaturedState(listingId: string, isFeatured: boolean) {
    setVisibleListings((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, isFeatured } : listing))
    );
  }

  async function handleConfirmDelete() {
    if (!listingToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/delete-listing/${listingToDelete.id}`, {
        method: "DELETE"
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete listing.");
      }

      setListingToDelete(null);
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleFeaturedToggle(listing: Listing, nextChecked: boolean) {
    if (nextChecked && !listing.isFeatured && featuredCount >= 10) {
      window.alert(t.adminListings.featuredLimitReached);
      return;
    }

    setFeaturedPendingIds((current) => ({ ...current, [listing.id]: true }));

    try {
      const response = await fetch(`/api/admin/edit-listing/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isFeatured: nextChecked })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = payload?.error ?? t.adminListings.featuredUpdateFailed;
        window.alert(errorMessage);
        return;
      }

      setListingFeaturedState(listing.id, nextChecked);
      setFeaturedCount((current) => current + (nextChecked ? 1 : -1));
      router.refresh();
    } catch {
      window.alert(t.adminListings.featuredUpdateFailed);
    } finally {
      setFeaturedPendingIds((current) => ({ ...current, [listing.id]: false }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-900 dark:text-slate-100">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-amber-400">{t.adminPage.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{t.adminListings.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.adminListings.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              id="admin-add-button"
              data-automation="admin-add-button"
              href="/admin/add"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {t.adminListings.addButton}
            </Link>
            <AdminLogoutButton />
            <Link
              id="admin-dashboard-home"
              data-automation="admin-dashboard-home"
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t.adminPage.backHome}
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <form id="admin-listing-search-form" data-automation="admin-listing-search-form" method="get" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="admin-listing-search" className="label-base">
              {t.adminListings.searchLabel}
            </label>
            <input
              id="admin-listing-search"
              data-automation="admin-listing-search-input"
              name="q"
              type="search"
              defaultValue={searchTerm}
              placeholder={t.adminListings.searchPlaceholder}
              className="input-base"
            />
          </div>

          <div className="flex gap-3">
            <button
              id="admin-listing-search-button"
              data-automation="admin-listing-search-button"
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {t.adminListings.searchButton}
            </button>
            <Link
              id="admin-listing-search-clear"
              data-automation="admin-listing-search-clear"
              href="/admin/listings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t.adminListings.clearButton}
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/70">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <th className="px-4 py-4">{t.adminListings.thumbnail}</th>
                <th className="px-4 py-4">{t.adminListings.refId}</th>
                <th className="px-4 py-4">{t.adminListings.titleColumn}</th>
                <th className="px-4 py-4">{t.adminListings.price}</th>
                <th className="px-4 py-4">{t.adminListings.featured}</th>
                <th className="px-4 py-4">{t.adminListings.status}</th>
                <th className="px-4 py-4">{t.adminListings.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/80">
              {visibleListings.length > 0 ? (
                visibleListings.map((listing) => {
                  const thumbnail = listing.images[0] ? getListingImageSrc(listing.id, listing.images[0]) : "/property-placeholder.svg";
                  const isFeaturedPending = Boolean(featuredPendingIds[listing.id]);

                  return (
                    <tr
                      key={listing.id}
                      id={`admin-listing-row-${listing.id}`}
                      data-automation={`admin-listing-row-${listing.id}`}
                      tabIndex={0}
                      role="link"
                      onClick={() => openPublicListing(listing.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openPublicListing(listing.id);
                        }
                      }}
                      className="cursor-pointer text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-4">
                        <div className="relative h-16 w-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Image src={thumbnail} alt={listing.title} fill className="object-cover" sizes="96px" />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{listing.refId}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/property/${listing.id}`}
                          target="_blank"
                          rel="noreferrer"
                          data-automation={`view-public-link-${listing.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-2 font-semibold text-slate-900 transition hover:text-brand-700 dark:text-slate-100 dark:hover:text-amber-400"
                        >
                          {listing.title}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <div className="text-xs text-slate-500">{listing.location}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-brand-700 dark:text-amber-400">{formatListingPrice(listing.price, listing.currency)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${listing.type === "house" ? "bg-blue-600" : "bg-emerald-600"}`}>
                          {listing.type === "house" ? t.adminListings.statusHouse : t.adminListings.statusLand}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                        <label
                          htmlFor={`quick-toggle-featured-${listing.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500 dark:hover:text-slate-100"
                        >
                          <span className="relative flex h-5 w-5 items-center justify-center">
                            <input
                              id={`quick-toggle-featured-${listing.id}`}
                              data-automation={`quick-toggle-featured-${listing.id}`}
                              type="checkbox"
                              checked={Boolean(featuredById.get(listing.id))}
                              disabled={isFeaturedPending}
                              onChange={(event) => handleFeaturedToggle(listing, event.target.checked)}
                              onClick={(event) => event.stopPropagation()}
                              className="peer sr-only"
                            />
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                                featuredById.get(listing.id)
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900"
                              } ${isFeaturedPending ? "opacity-70" : ""}`}
                            >
                              {isFeaturedPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </span>
                          </span>
                          <span>{featuredById.get(listing.id) ? t.adminListings.featuredOn : t.adminListings.featuredOff}</span>
                        </label>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            id={`edit-button-${listing.id}`}
                            data-automation={`edit-button-${listing.id}`}
                            href={`/admin/edit/${listing.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {t.adminListings.edit}
                          </Link>
                          <button
                            id={`delete-button-${listing.id}`}
                            data-automation={`delete-button-${listing.id}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteError("");
                              setListingToDelete(listing);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t.deleteListing.button}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={7}>
                    {t.adminListings.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.adminListings.showing} {listings.length} {t.adminListings.listingsUnit} / {totalListings} {t.adminListings.listingsUnit}
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={previousHref}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              currentPage <= 1
                ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {t.adminListings.previous}
          </Link>
          <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={nextHref}
            data-automation="admin-pagination-next"
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              currentPage >= totalPages
                ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {t.adminListings.next}
          </Link>
        </div>
      </div>

      {listingToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">{t.adminListings.deleteTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.adminListings.deleteDescription}</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{listingToDelete.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.adminListings.refId}: {listingToDelete.refId}
                </p>
                {deleteError ? <p className="mt-3 text-sm text-red-600">{deleteError}</p> : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                id="cancel-delete-btn"
                data-automation="cancel-delete-btn"
                type="button"
                onClick={() => {
                  setListingToDelete(null);
                  setDeleteError("");
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t.adminListings.cancel}
              </button>
              <button
                id="confirm-delete-btn"
                data-automation="confirm-delete-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? t.adminListings.deleting : t.adminListings.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
