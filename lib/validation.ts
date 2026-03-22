import { ListingType, ValidationErrors } from "@/lib/types";
import { getDictionary } from "@/lib/get-dictionary";

type FormFields = {
  type: ListingType | string;
  currency?: string;
  title: string;
  price: string;
  location: string;
  areaSqm: string;
  description: string;
  roomCount?: string;
  floorNumber?: string;
  heatingType?: string;
  zoningStatus?: string;
  islandNumber?: string;
  parcelNumber?: string;
  photos: Array<File | string>;
  existingPhotos?: string[];
};

function isListingType(value: string): value is ListingType {
  return value === "house" || value === "land";
}

export function validateListingForm(fields: FormFields): ValidationErrors {
  const t = getDictionary();
  const errors: ValidationErrors = {};

  if (!isListingType(fields.type)) {
    errors.type = t.errors.propertyTypeRequired;
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

    if (!fields.heatingType?.trim()) {
      errors.heatingType = t.errors.heatingTypeRequired;
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
