"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Listing } from "@/lib/types";
import { getListingImageSrc } from "@/lib/photo-path";

type AdminListingsManagerProps = {
  listings: Listing[];
  currentPage: number;
  totalPages: number;
  totalListings: number;
  previousHref: string;
  nextHref: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function AdminListingsManager({
  listings,
  currentPage,
  totalPages,
  totalListings,
  previousHref,
  nextHref
}: AdminListingsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function openPublicListing(listingId: string) {
    window.open(`/property/${listingId}`, "_blank", "noopener,noreferrer");
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Admin Listings</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Listing Manager</h1>
            <p className="mt-2 text-sm text-slate-600">Manage listings, search by Ref ID, and move quickly between records.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              id="admin-add-button"
              data-automation="admin-add-button"
              href="/admin/add"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add New Listing
            </Link>
            <form id="admin-logout-form" data-automation="admin-logout-form" method="post" action="/api/admin/logout">
              <button
                id="logout-button"
                data-automation="logout-button"
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </form>
            <Link
              id="admin-dashboard-home"
              data-automation="admin-dashboard-home"
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <form id="admin-listing-search-form" data-automation="admin-listing-search-form" method="get" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="admin-listing-search" className="label-base">
              Search by Ref ID or Title
            </label>
            <input
              id="admin-listing-search"
              data-automation="admin-listing-search-input"
              name="q"
              type="search"
              defaultValue={searchTerm}
              placeholder="Enter Ref ID, title, or location"
              className="input-base"
            />
          </div>

          <div className="flex gap-3">
            <button
              id="admin-listing-search-button"
              data-automation="admin-listing-search-button"
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Search
            </button>
            <Link
              id="admin-listing-search-clear"
              data-automation="admin-listing-search-clear"
              href="/admin/listings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-4">Thumbnail</th>
                <th className="px-4 py-4">Ref ID</th>
                <th className="px-4 py-4">Title</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {listings.length > 0 ? (
                listings.map((listing) => {
                  const thumbnail = listing.images[0] ? getListingImageSrc(listing.id, listing.images[0]) : "/property-placeholder.svg";

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
                      className="cursor-pointer text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <div className="relative h-16 w-24 overflow-hidden rounded-2xl bg-slate-100">
                          <Image src={thumbnail} alt={listing.title} fill className="object-cover" sizes="96px" />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{listing.refId}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/property/${listing.id}`}
                          target="_blank"
                          rel="noreferrer"
                          data-automation={`view-public-link-${listing.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-2 font-semibold text-slate-900 transition hover:text-brand-700"
                        >
                          {listing.title}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <div className="text-xs text-slate-500">{listing.location}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-brand-700">{formatCurrency(listing.price)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${listing.type === "house" ? "bg-blue-600" : "bg-emerald-600"}`}>
                          {listing.type === "house" ? "House" : "Land"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            id={`edit-button-${listing.id}`}
                            data-automation={`edit-button-${listing.id}`}
                            href={`/admin/edit/${listing.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
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
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Showing {listings.length} of {totalListings} listings
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={previousHref}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              currentPage <= 1 ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Previous
          </Link>
          <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={nextHref}
            data-automation="admin-pagination-next"
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              currentPage >= totalPages ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Next
          </Link>
        </div>
      </div>

      {listingToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-950">Delete listing?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Are you sure you want to delete this listing? This action cannot be undone.
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{listingToDelete.title}</p>
                <p className="text-xs text-slate-500">Ref No: {listingToDelete.refId}</p>
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
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                data-automation="confirm-delete-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
