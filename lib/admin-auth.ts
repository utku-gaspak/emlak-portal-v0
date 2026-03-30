import { cookies } from "next/headers";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { ADMIN_PASSWORD, ADMIN_USERNAME, NEXTAUTH_SECRET } from "@/lib/auth-env";

export const ADMIN_COOKIE_NAME = "emlak-admin-auth";
export { ADMIN_PASSWORD, ADMIN_USERNAME, NEXTAUTH_SECRET };

export async function getAdminSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return null;
  }

  try {
    const request = {
      headers: {
        cookie: cookieHeader
      }
    } as Parameters<typeof getToken>[0]["req"];

    const token = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET
    });

    if (!token) {
      return null;
    }

    return {
      user: {
        name: typeof token.name === "string" ? token.name : null,
        email: null,
        image: null
      },
      expires: typeof token.exp === "number" ? new Date(token.exp * 1000).toISOString() : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(session);
}
