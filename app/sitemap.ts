import type { MetadataRoute } from "next";
import { getListings } from "@/lib/listings-store";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();

  return [
    {
      url: SITE_URL,
      lastModified: new Date()
    },
    ...listings.map((listing) => ({
      url: `${SITE_URL}/property/${listing.id}`,
      lastModified: listing.createdAt ? new Date(listing.createdAt) : new Date()
    }))
  ];
}
