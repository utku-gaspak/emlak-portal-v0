import { redirect } from "next/navigation";
import { AdminListingsManager } from "@/components/AdminListingsManager";
import { getListings } from "@/lib/listings-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ITEMS_PER_PAGE = 10;

type AdminListingsPageProps = {
  searchParams: Promise<any>;
};

function firstSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
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

  const resolvedParams = await searchParams;
  const searchTerm = firstSearchValue(resolvedParams?.q).trim();
  const pageNumber = Number(firstSearchValue(resolvedParams?.page));
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.floor(pageNumber) : 1;
  const allListings = await getListings();
  const normalizedSearch = searchTerm.toLowerCase();

  const filteredListings = normalizedSearch
      ? allListings.filter((listing) => {
        const searchableText = [listing.title, listing.location, listing.listingNo].join(" ").toLowerCase();
        return searchableText.includes(normalizedSearch);
      })
    : allListings;

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const pageListings = filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalFeaturedListings = allListings.filter((listing) => listing.isFeatured).length;

  return (
    <AdminListingsManager
      listings={pageListings}
      currentPage={safePage}
      totalPages={totalPages}
      totalListings={filteredListings.length}
      totalFeaturedListings={totalFeaturedListings}
      previousHref={buildPageHref(searchTerm, Math.max(1, safePage - 1))}
      nextHref={buildPageHref(searchTerm, Math.min(totalPages, safePage + 1))}
    />
  );
}

