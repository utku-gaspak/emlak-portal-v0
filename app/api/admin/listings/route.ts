import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { validateListingForm } from "@/lib/validation";
import { LISTINGS_TABLE, supabase } from "@/lib/supabase";
import { ListingType } from "@/lib/types";
import { normalizeCurrency } from "@/lib/currency";
import { saveUploadedPhotos, deleteUploadedFiles } from "@/lib/listing-media";
import { resolveListingTypeFromCategoryId } from "@/lib/categories";

function getListingType(formValue: string): ListingType | "" {
  return formValue === "house" || formValue === "land" ? formValue : "";
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildInsertData(args: {
  type: ListingType;
  status: "satilik" | "kiralik";
  categoryId: string;
  title: string;
  price: string;
  currency: string;
  location: string;
  areaSqm: string;
  latitude: string;
  longitude: string;
  description: string;
  roomCount: string;
  floorNumber: string;
  heatingType: string;
  zoningStatus: string;
  islandNumber: string;
  parcelNumber: string;
  isFeatured: boolean;
  images: string[];
  viewCount?: number;
}) {
  return {
    type: args.type,
    status: args.status,
    category_id: args.categoryId,
    title: args.title.trim(),
    price: Number(args.price),
    currency: args.currency,
    location: args.location.trim(),
    area_sqm: Number(args.areaSqm),
    latitude: parseOptionalNumber(args.latitude),
    longitude: parseOptionalNumber(args.longitude),
    description: args.description.trim(),
    images: args.images,
    is_featured: args.isFeatured,
    view_count: typeof args.viewCount === "number" ? args.viewCount : 0,
    room_count: args.type === "house" ? args.roomCount.trim() : null,
    floor_number: args.type === "house" ? args.floorNumber.trim() : null,
    heating_type: args.type === "house" ? args.heatingType.trim() : null,
    zoning_status: args.type === "land" ? args.zoningStatus.trim() : null,
    island_number: args.type === "land" ? args.islandNumber.trim() : null,
    parcel_number: args.type === "land" ? args.parcelNumber.trim() : null
  };
}

export async function GET() {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const { data, error } = await supabase.from(LISTINGS_TABLE).select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listings: data }, { status: 200 });
}

export async function POST(request: Request) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, errors: { auth: t.errors.authUnauthorized } }, { status: 401 });
  }

  const listingId = crypto.randomUUID();
  let uploadedImages: string[] = [];

  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());
    console.log("Payload:", body);
    const type = getListingType(String(formData.get("type") ?? ""));
    const title = String(formData.get("title") ?? "");
    const price = String(formData.get("price") ?? "");
    const currency = normalizeCurrency(String(formData.get("currency") ?? ""));
    const location = String(formData.get("location") ?? "");
    const areaSqm = String(formData.get("areaSqm") ?? "");
    const latitude = String(formData.get("latitude") ?? "");
    const longitude = String(formData.get("longitude") ?? "");
    const description = String(formData.get("description") ?? "");
    const statusValue = String(formData.get("status") ?? "");
    const status = statusValue === "kiralik" ? "kiralik" : "satilik";
    const categoryId = String(formData.get("category_id") ?? formData.get("categoryId") ?? "");
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
      status,
      categoryId,
      title,
      price,
      currency,
      location,
      areaSqm,
      latitude,
      longitude,
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

    uploadedImages = await saveUploadedPhotos(listingId, photos);

    const insertData = buildInsertData({
      type: resolvedType,
      status,
      categoryId: categoryId.trim(),
      title,
      price,
      currency,
      location,
      areaSqm,
      latitude,
      longitude,
      description,
      roomCount,
      floorNumber,
      heatingType,
      zoningStatus,
      islandNumber,
      parcelNumber,
      isFeatured,
      images: uploadedImages
    });

    const { data: savedListing, error: dbError } = await supabase.from(LISTINGS_TABLE).insert(insertData).select("*").single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(
      {
        ok: true,
        listingId: savedListing.id,
        refId: savedListing.ref_id ?? savedListing.refId,
        type: savedListing.type,
        images: savedListing.images ?? []
      },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedImages.length > 0) {
      await deleteUploadedFiles(listingId, uploadedImages);
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
