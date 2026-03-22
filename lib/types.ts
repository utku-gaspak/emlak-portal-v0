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
  photos?: string[];
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
  type: ListingType;
  isFeatured?: boolean;
  currency?: ListingCurrency;
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
};

export type ValidationErrors = Partial<
  Record<
    | "type"
    | "currency"
    | "title"
    | "price"
    | "location"
    | "areaSqm"
    | "roomCount"
    | "floorNumber"
    | "heatingType"
    | "zoningStatus"
    | "islandNumber"
    | "parcelNumber"
    | "description"
    | "photos",
    string
  >
>;
