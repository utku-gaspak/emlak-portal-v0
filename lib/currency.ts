import type { ListingCurrency } from "@/lib/types";

export const DEFAULT_CURRENCY: ListingCurrency = "TL";

const currencySymbols: Record<ListingCurrency, string> = {
  TL: "₺",
  USD: "$",
  EUR: "€"
};

export function normalizeCurrency(value: unknown): ListingCurrency {
  if (value === "USD" || value === "EUR" || value === "TL" || value === "TRY") {
    if (value === "TRY") {
      return "TL";
    }
    return value;
  }

  return DEFAULT_CURRENCY;
}

export function formatListingPrice(value: number, currency: ListingCurrency = DEFAULT_CURRENCY): string {
  const formattedNumber = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0
  }).format(value);

  if (currency === "TL") {
    return `${formattedNumber} ${currencySymbols[currency]}`;
  }

  return `${currencySymbols[currency]} ${formattedNumber}`;
}
