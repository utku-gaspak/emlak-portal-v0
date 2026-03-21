const whatsappNumber = process.env.NEXT_PUBLIC_AGENT_WHATSAPP ?? "";
const phoneNumber = process.env.NEXT_PUBLIC_AGENT_PHONE ?? "";

type Locale = "tr" | "en";

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

export function getWhatsAppHref(listingTitle: string, locale: Locale = "tr"): string {
  const number = sanitizeWhatsAppNumber(whatsappNumber);
  const message = encodeURIComponent(whatsappMessages[locale]?.(listingTitle) ?? whatsappMessages.tr(listingTitle));

  return number ? `https://wa.me/${number}?text=${message}` : `https://wa.me/?text=${message}`;
}

export function getCallHref(): string {
  const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
  return sanitizedPhone ? `tel:${sanitizedPhone}` : "tel:";
}
