import { ListingInput, ListingType, ValidationErrors } from "@/lib/types";
import { getDictionary } from "@/lib/get-dictionary";
import { getCategoryById } from "@/lib/categories";
import { shouldShowHeatingType } from "@/lib/category-utils";

type FormFields = Omit<ListingInput, "type" | "price" | "areaSqm" | "photos" | "isFeatured"> & {
  isFeatured?: boolean;
  type: ListingType | string;
  price: string;
  areaSqm: string;
  latitude?: string;
  longitude?: string;
  photos: Array<File | string>;
  existingPhotos?: string[];
  heatingType?: string | null;
};

function isListingType(value: string): value is ListingType {
  return value === "house" || value === "land";
}

export async function validateListingForm(fields: FormFields): Promise<ValidationErrors> {
  const t = await getDictionary();
  const errors: ValidationErrors = {};
  const selectedCategory = fields.categoryId.trim() ? await getCategoryById(fields.categoryId.trim()) : null;
  const selectedParentCategory = selectedCategory?.parentId ? await getCategoryById(selectedCategory.parentId) : null;
  const requiresHeatingType = fields.type === "house" && shouldShowHeatingType(selectedCategory, selectedParentCategory);

  if (!isListingType(fields.type)) {
    errors.type = t.errors.propertyTypeRequired;
  }

  if (!fields.status?.trim()) {
    errors.status = t.errors.statusRequired;
  } else if (!["satilik", "kiralik"].includes(fields.status)) {
    errors.status = t.errors.statusInvalid;
  }

  if (!fields.categoryId?.trim()) {
    errors.categoryId = t.errors.categoryRequired;
  }

  if (!fields.title.trim()) {
    errors.title = t.errors.titleRequired;
  }

  if (fields.currency !== undefined && !["TL", "USD", "EUR"].includes(fields.currency)) {
    errors.currency = t.errors.currencyInvalid;
  }

  const price = Number(fields.price);
  if (!fields.price.trim() || Number.isNaN(price) || price <= 0) {
    errors.price = t.errors.priceInvalid;
  }

  if (!fields.location.trim()) {
    errors.location = t.errors.locationRequired;
  }

  const area = Number(fields.areaSqm);
  if (!fields.areaSqm.trim() || Number.isNaN(area) || area <= 0) {
    errors.areaSqm = t.errors.areaInvalid;
  }

  if (fields.latitude?.trim()) {
    const latitude = Number(fields.latitude);
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = t.errors.latitudeInvalid;
    }
  }

  if (fields.longitude?.trim()) {
    const longitude = Number(fields.longitude);
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = t.errors.longitudeInvalid;
    }
  }

  if (!fields.description.trim()) {
    errors.description = t.errors.descriptionRequired;
  }

  const hasPhotos = fields.photos.length > 0 || (fields.existingPhotos?.length ?? 0) > 0;

  if (!hasPhotos) {
    errors.photos = t.errors.photosRequired;
  }

  if (fields.type === "house") {
    if (!fields.roomCount?.trim()) {
      errors.roomCount = t.errors.roomCountRequired;
    }

    if (!fields.floorNumber?.trim()) {
      errors.floorNumber = t.errors.floorNumberRequired;
    }

    const heatingType = fields.heatingType?.trim() ?? "";

    if (requiresHeatingType && !heatingType) {
      errors.heatingType = t.errors.heatingTypeRequired;
    } else if (heatingType) {
      const allowedHeatingTypes = [
        "Doğalgaz (Kombi)",
        "Merkezi Sistem",
        "Yerden Isıtma",
        "Klima",
        "Soba / Katı Yakıt",
        "Isı Pompası",
        "Yok"
      ];

      if (!allowedHeatingTypes.includes(heatingType)) {
        errors.heatingType = t.errors.heatingTypeRequired;
      }
    }
  }

  if (fields.type === "land") {
    if (!fields.zoningStatus?.trim()) {
      errors.zoningStatus = t.errors.zoningStatusRequired;
    }

    if (!fields.islandNumber?.trim()) {
      errors.islandNumber = t.errors.islandNumberRequired;
    }

    if (!fields.parcelNumber?.trim()) {
      errors.parcelNumber = t.errors.parcelNumberRequired;
    }
  }

  return errors;
}
