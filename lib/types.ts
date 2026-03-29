export type ListingType = "house" | "land";
export type ListingStatus = "satilik" | "kiralik";
export type ListingCurrency = "TL" | "USD" | "EUR";

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  slug?: string | null;
};

export type ListingCommonFields = {
  id: string;
  listingNo: string;
  isFeatured: boolean;
  status: ListingStatus;
  categoryId: string;
  currency: ListingCurrency;
  title: string;
  price: number;
  location: string;
  areaSqm: number;
  description: string;
  images: string[];
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  viewCount: number;
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
  listingNo: string;
  type: ListingType;
  status: ListingStatus;
  categoryId: string;
  isFeatured: boolean;
  currency: ListingCurrency;
  title: string;
  price: string;
  location: string;
  areaSqm: string;
  latitude?: string;
  longitude?: string;
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

