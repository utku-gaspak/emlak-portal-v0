import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getListingById, updateListingById } from "@/lib/listings-store";
import { deleteAndReindexListingPhoto } from "@/lib/listing-media";

type DeleteImageBody = {
  propertyId?: string;
  imageIndex?: number;
};

export async function DELETE(request: Request) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  let body: DeleteImageBody = {};

  try {
    body = (await request.json()) as DeleteImageBody;
  } catch {
    return NextResponse.json({ ok: false, error: t.errors.invalidRequestBody }, { status: 400 });
  }

  const propertyId = String(body.propertyId ?? "").trim();
  const imageIndex = Number(body.imageIndex);

  if (!propertyId || !Number.isInteger(imageIndex) || imageIndex < 0) {
    return NextResponse.json({ ok: false, error: t.errors.invalidImageSelection }, { status: 400 });
  }

  const listing = await getListingById(propertyId);

  if (!listing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  const normalizedImages = listing.images.map((image) => image.trim()).filter((image) => image.length > 0);

  if (imageIndex >= normalizedImages.length) {
    return NextResponse.json({ ok: false, error: t.errors.photoNotFound }, { status: 404 });
  }

  const reindexedImages = await deleteAndReindexListingPhoto(propertyId, normalizedImages, imageIndex);

  const updatedListing = {
    ...listing,
    images: reindexedImages,
    photos: reindexedImages
  };

  await updateListingById(propertyId, updatedListing);

  return NextResponse.json(
    {
      ok: true,
      images: reindexedImages
    },
    { status: 200 }
  );
}
