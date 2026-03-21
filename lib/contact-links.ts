const whatsappNumber = process.env.NEXT_PUBLIC_AGENT_WHATSAPP ?? "";
const phoneNumber = process.env.NEXT_PUBLIC_AGENT_PHONE ?? "";

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

export function getWhatsAppHref(listingTitle: string): string {
  const number = sanitizeWhatsAppNumber(whatsappNumber);
  const message = encodeURIComponent(`Hello, I am interested in: ${listingTitle}`);

  return number ? `https://wa.me/${number}?text=${message}` : `https://wa.me/?text=${message}`;
}

export function getCallHref(): string {
  const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
  return sanitizedPhone ? `tel:${sanitizedPhone}` : "tel:";
}
