const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;

  return value.replace(/\/+$/, "");
}
