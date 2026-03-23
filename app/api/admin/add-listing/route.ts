import { NextResponse } from "next/server";
import { addListing } from "@/lib/listings-store";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { validateListingForm } from "@/lib/validation";
import { HouseListing, LandListing, ListingType } from "@/lib/types";
import { normalizeCurrency } from "@/lib/currency";
import { deleteUploadedFiles, saveUploadedPhotos } from "@/lib/listing-media";

function getListingType(formValue: string): ListingType | "" {
  return formValue === "house" || formValue === "land" ? formValue : "";
}

export async function POST(request: Request) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, errors: { auth: t.errors.authUnauthorized } }, { status: 401 });
  }

  const formData = await request.formData();
  const type = getListingType(String(formData.get("type") ?? ""));
  const title = String(formData.get("title") ?? "");
  const price = String(formData.get("price") ?? "");
  const currency = normalizeCurrency(String(formData.get("currency") ?? ""));
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
  const photos = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File)
    .filter((item) => item.size > 0);

  const errors = await validateListingForm({
    type,
    title,
    price,
    currency,
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

  let savedImageNames: string[] = [];

  try {
    savedImageNames = await saveUploadedPhotos(listingId, photos);

    const baseListing = {
      id: listingId,
      refId: 0,
      isFeatured,
      type,
      title: title.trim(),
      price: Number(price),
      currency,
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
    if (savedImageNames.length > 0) {
      await deleteUploadedFiles(listingId, savedImageNames);
    }
    throw error;
  }
}
