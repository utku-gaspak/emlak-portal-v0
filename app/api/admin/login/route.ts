import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "Use NextAuth signIn() for admin login."
    },
    { status: 410 }
  );
}
