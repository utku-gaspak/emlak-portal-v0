import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addListing } from "@/lib/listings-store";
import { getDictionary } from "@/lib/locale";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { validateListingForm } from "@/lib/validation";
import { HouseListing, LandListing, ListingType } from "@/lib/types";
import { deleteListingUploadDir, ensurePublicDirectory, saveUploadedPhotos } from "@/lib/listing-media";

function getListingType(formValue: string): ListingType | "" {
  return formValue === "house" || formValue === "land" ? formValue : "";
}

export async function POST(request: Request) {
  const t = getDictionary();
  const cookieStore = cookies();
  const isAuthorized = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, errors: { auth: t.errors.authUnauthorized } }, { status: 401 });
  }

  ensurePublicDirectory();

  const formData = await request.formData();
  const type = getListingType(String(formData.get("type") ?? ""));
  const title = String(formData.get("title") ?? "");
  const price = String(formData.get("price") ?? "");
  const location = String(formData.get("location") ?? "");
  const areaSqm = String(formData.get("areaSqm") ?? "");
  const description = String(formData.get("description") ?? "");
  const roomCount = String(formData.get("roomCount") ?? "");
  const floorNumber = String(formData.get("floorNumber") ?? "");
  const heatingType = String(formData.get("heatingType") ?? "");
  const zoningStatus = String(formData.get("zoningStatus") ?? "");
  const islandNumber = String(formData.get("islandNumber") ?? "");
  const parcelNumber = String(formData.get("parcelNumber") ?? "");
  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File)
    .filter((item) => item.size > 0);

  const errors = validateListingForm({
    type,
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
    photos
  });

  if (Object.keys(errors).length > 0 || !type) {
    return NextResponse.json(
      {
        ok: false,
        errors: !type ? { ...errors, type: t.errors.propertyTypeRequired } : errors
      },
      { status: 400 }
    );
  }

  const listingId = crypto.randomUUID();

  try {
    const savedImageNames = await saveUploadedPhotos(listingId, photos);

    const baseListing = {
      id: listingId,
      refId: 0,
      type,
      title: title.trim(),
      price: Number(price),
      location: location.trim(),
      areaSqm: Number(areaSqm),
      description: description.trim(),
      images: savedImageNames,
      photos: savedImageNames,
      createdAt: new Date().toISOString()
    };

    const listing =
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

    await addListing(listing);

    return NextResponse.json(
      {
        ok: true,
        listingId: listing.id,
        refId: listing.refId,
        type: listing.type,
        images: savedImageNames
      },
      { status: 201 }
    );
  } catch (error) {
    await deleteListingUploadDir(listingId);
    throw error;
  }
}
