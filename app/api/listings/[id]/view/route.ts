import { NextResponse } from "next/server";
import { incrementListingViewCount } from "@/lib/listings-store";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const updatedListing = await incrementListingViewCount(resolvedParams.id);

  if (!updatedListing) {
    return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      viewCount: updatedListing.viewCount
    },
    { status: 200 }
  );
}
