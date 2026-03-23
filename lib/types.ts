export type ListingType = "house" | "land";
export type ListingCurrency = "TL" | "USD" | "EUR";

export type ListingCommonFields = {
  id: string;
  refId: number;
  isFeatured: boolean;
  currency: ListingCurrency;
  title: string;
  price: number;
  location: string;
  areaSqm: number;
  description: string;
  images: string[];
  createdAt: string;
};

export type HouseListing = ListingCommonFields & {
  type: "house";
  roomCount: string;
  floorNumber: string;
  heatingType: string;
};

export type LandListing = ListingCommonFields & {
  type: "land";
  zoningStatus: string;
  islandNumber: string;
  parcelNumber: string;
};

export type Listing = HouseListing | LandListing;

export type ListingInput = {
  refId?: number;
  type: ListingType;
  isFeatured: boolean;
  currency: ListingCurrency;
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
  photos: File[];
  existingImages?: string[];
};

export type ValidationErrors = Partial<Record<keyof ListingInput, string>>;
