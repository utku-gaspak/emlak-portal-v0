import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getListingById, getListings, removeListingById, updateListingById } from "@/lib/listings-store";
import { validateListingForm } from "@/lib/validation";
import { HouseListing, LandListing, Listing, ListingType } from "@/lib/types";
import { deleteUploadedFiles, saveUploadedPhotos } from "@/lib/listing-media";
import { normalizeCurrency } from "@/lib/currency";
import { resolveListingTypeFromCategoryId } from "@/lib/categories";

type RouteParams = Promise<{
  id: string;
}>;

function getListingType(formValue: string, fallback: ListingType): ListingType {
  return formValue === "house" || formValue === "land" ? formValue : fallback;
}

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    const t = await getDictionary();
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  return NextResponse.json({ ok: true, listing }, { status: 200 });
}

export async function DELETE(_request: Request, { params }: { params: RouteParams }) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const { id } = await params;
  const deletedListing = await removeListingById(id);

  if (!deletedListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  await deleteUploadedFiles(id, deletedListing.images);

  return NextResponse.json({ ok: true, deletedId: id }, { status: 200 });
}

export async function PUT(request: Request, { params }: { params: RouteParams }) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, errors: { auth: t.errors.authUnauthorized } }, { status: 401 });
  }

  const { id } = await params;
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return NextResponse.json({ ok: false, errors: { listing: t.errors.listingNotFound } }, { status: 404 });
  }

  const formData = await request.formData();
  const type = getListingType(String(formData.get("type") ?? existingListing.type), existingListing.type);
  const status = String(formData.get("status") ?? existingListing.status ?? "satilik");
  const categoryId = String(formData.get("categoryId") ?? existingListing.categoryId ?? "");
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
  const existingImages = [...formData.getAll("existingImages"), ...formData.getAll("existingPhotos")]
    .map((photo) => String(photo).trim())
    .filter((photo) => photo.length > 0);

  const preservedImages = existingImages.length > 0 ? existingImages : existingListing.images;

  const errors = await validateListingForm({
    type,
    status: status as "satilik" | "kiralik",
    categoryId,
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
      status: status as "satilik" | "kiralik",
      categoryId: categoryId.trim(),
      type: resolvedType,
      title: title.trim(),
      price: Number(price),
      currency,
      location: location.trim(),
      areaSqm: Number(areaSqm),
      description: description.trim(),
      images: combinedImages
    };

    const updatedListing: Listing =
      resolvedType === "house"
        ? {
            ...baseListing,
            type: "house",
            roomCount: roomCount.trim(),
            floorNumber: floorNumber.trim(),
            heatingType: heatingType.trim()
          }
        : {
            ...baseListing,
            type: "land",
            zoningStatus: zoningStatus.trim(),
            islandNumber: islandNumber.trim(),
            parcelNumber: parcelNumber.trim()
          };

    const savedListing = await updateListingById(listingId, updatedListing);

    if (!savedListing) {
      if (savedNewPhotoPaths.length > 0) {
        await deleteUploadedFiles(listingId, savedNewPhotoPaths);
      }

      return NextResponse.json({ ok: false, errors: { listing: t.errors.listingNotFound } }, { status: 404 });
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

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const { id } = await params;
  const existingListing = await getListingById(id);

  if (!existingListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as { isFeatured?: unknown } | null;
  const nextIsFeatured = typeof payload?.isFeatured === "boolean" ? payload.isFeatured : Boolean(payload?.isFeatured);

  if (nextIsFeatured && !existingListing.isFeatured) {
    const allListings = await getListings();
    const featuredCount = allListings.filter((listing) => listing.isFeatured).length;

    if (featuredCount >= 10) {
      return NextResponse.json({ ok: false, error: t.adminListings.featuredLimitReached }, { status: 400 });
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
