import { NextResponse } from "next/server";
import { updateListingById, getListingById, getListings } from "@/lib/listings-store";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { validateListingForm } from "@/lib/validation";
import { HouseListing, LandListing, ListingType } from "@/lib/types";
import { deleteUploadedFiles, ensurePublicDirectory, saveUploadedPhotos } from "@/lib/listing-media";
import { getPhotoFileName } from "@/lib/photo-path";
import { normalizeCurrency } from "@/lib/currency";

function getListingType(formValue: string, fallback: ListingType): ListingType {
  return formValue === "house" || formValue === "land" ? formValue : fallback;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const t = getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, errors: { auth: t.errors.authUnauthorized } }, { status: 401 });
  }

  ensurePublicDirectory();

  const { id } = params;
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return NextResponse.json({ ok: false, errors: { listing: "Listing not found." } }, { status: 404 });
  }

  const formData = await request.formData();
  const type = getListingType(String(formData.get("type") ?? existingListing.type), existingListing.type);
  const title = String(formData.get("title") ?? "");
  const price = String(formData.get("price") ?? "");
  const currency = normalizeCurrency(String(formData.get("currency") ?? existingListing.currency ?? "TL"));
  const location = String(formData.get("location") ?? "");
  const areaSqm = String(formData.get("areaSqm") ?? "");
  const description = String(formData.get("description") ?? "");
  const roomCount = String(formData.get("roomCount") ?? "");
  const floorNumber = String(formData.get("floorNumber") ?? "");
  const heatingType = String(formData.get("heatingType") ?? "");
  const zoningStatus = String(formData.get("zoningStatus") ?? "");
  const islandNumber = String(formData.get("islandNumber") ?? "");
  const parcelNumber = String(formData.get("parcelNumber") ?? "");
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const uploadedPhotos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File)
    .filter((item) => item.size > 0);
  const existingImages = [
    ...formData.getAll("existingImages"),
    ...formData.getAll("existingPhotos")
  ]
    .map((photo) => getPhotoFileName(String(photo)))
    .filter((photo) => photo.trim().length > 0);

  const preservedImages = existingImages.length > 0 ? existingImages : existingListing.images;

  const errors = validateListingForm({
    type,
    currency,
    title,
    price,
    location,
    areaSqm,
    description,
    roomCount,
    floorNumber,
    heatingType,
    zoningStatus,
    islandNumber,
    parcelNumber,
    photos: uploadedPhotos,
    existingPhotos: preservedImages
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const listingId = existingListing.id;
  const savedNewPhotoPaths: string[] = [];

  try {
    if (uploadedPhotos.length > 0) {
      const savedPhotos = await saveUploadedPhotos(listingId, uploadedPhotos, preservedImages.length);
      savedNewPhotoPaths.push(...savedPhotos);
    }

    const combinedImages = [...preservedImages, ...savedNewPhotoPaths];
    const baseListing = {
      id: existingListing.id,
      refId: existingListing.refId,
      createdAt: existingListing.createdAt,
      isFeatured,
      type,
      title: title.trim(),
      price: Number(price),
      currency,
      location: location.trim(),
      areaSqm: Number(areaSqm),
      description: description.trim(),
      images: combinedImages,
      photos: combinedImages
    };

    const updatedListing =
      type === "house"
        ? ({
            ...baseListing,
            type: "house",
            roomCount: roomCount.trim(),
            floorNumber: floorNumber.trim(),
            heatingType: heatingType.trim()
          } as HouseListing)
        : ({
            ...baseListing,
            type: "land",
            zoningStatus: zoningStatus.trim(),
            islandNumber: islandNumber.trim(),
            parcelNumber: parcelNumber.trim()
          } as LandListing);

    const savedListing = await updateListingById(listingId, updatedListing);

    if (!savedListing) {
      if (savedNewPhotoPaths.length > 0) {
        await deleteUploadedFiles(listingId, savedNewPhotoPaths);
      }

      return NextResponse.json({ ok: false, errors: { listing: "Listing not found." } }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        listingId: savedListing.id,
        refId: savedListing.refId,
        type: savedListing.type,
        images: savedListing.images
      },
      { status: 200 }
    );
  } catch (error) {
    if (savedNewPhotoPaths.length > 0) {
      await deleteUploadedFiles(listingId, savedNewPhotoPaths);
    }

    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const t = getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const existingListing = await getListingById(params.id);

  if (!existingListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as { isFeatured?: unknown } | null;
  const nextIsFeatured = typeof payload?.isFeatured === "boolean" ? payload.isFeatured : Boolean(payload?.isFeatured);

  if (nextIsFeatured && !existingListing.isFeatured) {
    const allListings = await getListings();
    const featuredCount = allListings.filter((listing) => listing.isFeatured).length;

    if (featuredCount >= 10) {
      return NextResponse.json(
        {
          ok: false,
          error: t.adminListings.featuredLimitReached
        },
        { status: 400 }
      );
    }
  }

  const updatedListing = {
    ...existingListing,
    isFeatured: nextIsFeatured
  };

  const savedListing = await updateListingById(existingListing.id, updatedListing);

  if (!savedListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      listingId: savedListing.id,
      refId: savedListing.refId,
      isFeatured: savedListing.isFeatured
    },
    { status: 200 }
  );
}
