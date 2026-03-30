import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ADMIN_PASSWORD, ADMIN_USERNAME, NEXTAUTH_SECRET } from "@/lib/auth-env";

export const ADMIN_COOKIE_NAME = "emlak-admin-auth";
export { ADMIN_PASSWORD, ADMIN_USERNAME, NEXTAUTH_SECRET };

export async function getAdminSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(session);
}
