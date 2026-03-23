const phoneNumber = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
const emailAddress = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "";
const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "";

type Locale = "tr" | "en";

type PublicContactConfig = {
  phone: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
};

const whatsappMessages: Record<Locale, (listingTitle: string) => string> = {
  tr: (listingTitle) => `Merhaba, ${listingTitle} ilanı için bilgi almak istiyorum.`,
  en: (listingTitle) => `Hello, I am interested in: ${listingTitle}`
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

export function getPublicContactConfig(): PublicContactConfig {
  return {
    phone: sanitizePhoneNumber(phoneNumber),
    email: emailAddress.trim(),
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

export function getCallHref(): string {
  const sanitizedPhone = getPublicContactConfig().phone;
  return sanitizedPhone ? `tel:${sanitizedPhone}` : "";
}
