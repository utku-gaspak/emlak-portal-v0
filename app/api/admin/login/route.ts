import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/locale";
import { ADMIN_COOKIE_NAME, ADMIN_PASSWORD } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const t = getDictionary();
  const body = await request.json().catch(() => ({}));
  const password = String(body?.password ?? "").trim();

  if (!password) {
    return NextResponse.json({ ok: false, errors: { password: t.errors.passwordRequired } }, { status: 400 });
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, errors: { password: t.errors.passwordInvalid } }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
