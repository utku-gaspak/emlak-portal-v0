import { NextResponse } from "next/server";
import { addListing } from "@/lib/listings-store";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { validateListingForm } from "@/lib/validation";
import { HouseListing, LandListing, ListingType } from "@/lib/types";
import { normalizeCurrency } from "@/lib/currency";
import { deleteUploadedFiles, saveUploadedPhotos } from "@/lib/listing-media";
import { resolveListingTypeFromCategoryId } from "@/lib/categories";

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
  const status = String(formData.get("status") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
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
    status: status as "satilik" | "kiralik",
    categoryId,
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

  if (!categoryId.trim()) {
    return NextResponse.json(
      {
        ok: false,
        errors: {
          categoryId: t.errors.categoryRequired
        }
      },
      { status: 400 }
    );
  }

  const resolvedType = await resolveListingTypeFromCategoryId(categoryId.trim());

  if (!resolvedType) {
    return NextResponse.json(
      {
        ok: false,
        errors: {
          categoryId: t.errors.categoryInvalid
        }
      },
      { status: 400 }
    );
  }

  const listingId = crypto.randomUUID();

  let savedImageNames: string[] = [];

  try {
    savedImageNames = await saveUploadedPhotos(listingId, photos);

    const listing =
      resolvedType === "house"
        ? ({
            refId: 0,
            isFeatured,
            status: status as "satilik" | "kiralik",
            categoryId: categoryId.trim(),
            type: "house",
            title: title.trim(),
            price: Number(price),
            currency,
            location: location.trim(),
            areaSqm: Number(areaSqm),
            latitude: String(formData.get("latitude") ?? "").trim() ? Number(String(formData.get("latitude") ?? "")) : null,
            longitude: String(formData.get("longitude") ?? "").trim() ? Number(String(formData.get("longitude") ?? "")) : null,
            description: description.trim(),
            images: savedImageNames,
            photos: savedImageNames,
            createdAt: new Date().toISOString(),
            viewCount: 0,
            roomCount: roomCount.trim(),
            floorNumber: floorNumber.trim(),
            heatingType: heatingType.trim()
          } as Omit<HouseListing, "id">)
        : ({
            refId: 0,
            isFeatured,
            status: status as "satilik" | "kiralik",
            categoryId: categoryId.trim(),
            type: "land",
            title: title.trim(),
            price: Number(price),
            currency,
            location: location.trim(),
            areaSqm: Number(areaSqm),
            latitude: String(formData.get("latitude") ?? "").trim() ? Number(String(formData.get("latitude") ?? "")) : null,
            longitude: String(formData.get("longitude") ?? "").trim() ? Number(String(formData.get("longitude") ?? "")) : null,
            description: description.trim(),
            images: savedImageNames,
            photos: savedImageNames,
            createdAt: new Date().toISOString(),
            viewCount: 0,
            zoningStatus: zoningStatus.trim(),
            islandNumber: islandNumber.trim(),
            parcelNumber: parcelNumber.trim()
          } as Omit<LandListing, "id">);

    const savedListing = await addListing(listing);

    return NextResponse.json(
      {
        ok: true,
        listingId: savedListing.id,
        refId: savedListing.refId,
        type: savedListing.type,
        images: savedListing.images
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
