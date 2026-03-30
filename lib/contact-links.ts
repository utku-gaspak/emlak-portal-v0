const phoneNumber = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
const emailAddress = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
const addressLine = process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "";
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "";
const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";
const firmName = process.env.NEXT_PUBLIC_FIRM_NAME?.trim() || "Gaspak Emlak";

type Locale = "tr" | "en";

type PublicContactConfig = {
  phone: string;
  email: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
};

const whatsappMessages: Record<Locale, (listingTitle: string) => string> = {
  tr: (listingTitle) => `Merhaba ${firmName}, ${listingTitle} ilanı için bilgi almak istiyorum.`,
  en: (listingTitle) => `Hello ${firmName}, I am interested in the ${listingTitle} listing.`
};

function sanitizeWhatsAppNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function sanitizePhoneNumber(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return "";
  }

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

function sanitizeUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return "";
  }
}

function sanitizeAddress(value: string): string {
  return value.trim();
}

export function getPublicContactConfig(): PublicContactConfig {
  return {
    phone: sanitizePhoneNumber(phoneNumber),
    email: emailAddress.trim(),
    address: sanitizeAddress(addressLine),
    instagramUrl: sanitizeUrl(instagramUrl),
    facebookUrl: sanitizeUrl(facebookUrl)
  };
}

export function getWhatsAppHref(listingTitle: string, locale: Locale = "tr"): string {
  const number = sanitizeWhatsAppNumber(getPublicContactConfig().phone);

  if (!number) {
    return "";
  }

  const message = encodeURIComponent(whatsappMessages[locale]?.(listingTitle) ?? whatsappMessages.tr(listingTitle));

  return `https://wa.me/${number}?text=${message}`;
}

export function getPropertyWhatsAppHref(listingTitle: string, listingNo: string | number, locale: Locale = "tr"): string {
  const number = sanitizeWhatsAppNumber(getPublicContactConfig().phone);

  if (!number) {
    return "";
  }

  const message =
    locale === "en"
      ? `Hello ${firmName}, I would like information about listing no ${listingNo} (${listingTitle}).`
      : `Merhaba ${firmName}, ${listingTitle} (İlan No: ${listingNo}) ilanı hakkında bilgi almak istiyorum.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function getCallHref(): string {
  const sanitizedPhone = getPublicContactConfig().phone;
  return sanitizedPhone ? `tel:${sanitizedPhone}` : "";
}

