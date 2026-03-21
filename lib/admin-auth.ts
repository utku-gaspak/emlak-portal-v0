import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "emlak-admin-auth";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "change-me-123";

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
}
