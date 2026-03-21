import { redirect } from "next/navigation";
import { AdminListingsManager } from "@/components/AdminListingsManager";
import { getListings } from "@/lib/listings-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ITEMS_PER_PAGE = 10;

type AdminListingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function isPureNumber(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function buildPageHref(searchTerm: string, page: number): string {
  const params = new URLSearchParams();

  if (searchTerm.trim()) {
    params.set("q", searchTerm.trim());
  }

  params.set("page", String(page));

  const queryString = params.toString();
  return queryString ? `/admin/listings?${queryString}` : "/admin/listings";
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const searchTerm = firstSearchValue(searchParams?.q).trim();
  const pageNumber = Number(firstSearchValue(searchParams?.page));
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.floor(pageNumber) : 1;
  const allListings = await getListings();
  const normalizedSearch = searchTerm.toLowerCase();

  const filteredListings = normalizedSearch
    ? allListings.filter((listing) => {
        if (isPureNumber(normalizedSearch)) {
          return listing.refId === Number(normalizedSearch);
        }

        const searchableText = [listing.title, listing.location].join(" ").toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
    : allListings;

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const pageListings = filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <AdminListingsManager
      listings={pageListings}
      currentPage={safePage}
      totalPages={totalPages}
      totalListings={filteredListings.length}
      previousHref={buildPageHref(searchTerm, Math.max(1, safePage - 1))}
      nextHref={buildPageHref(searchTerm, Math.min(totalPages, safePage + 1))}
    />
  );
}
