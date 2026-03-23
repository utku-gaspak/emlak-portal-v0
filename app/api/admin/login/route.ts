import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/get-dictionary";

export async function POST() {
  const t = await getDictionary();

  return NextResponse.json(
    {
      ok: false,
      error: t.errors.adminLoginRouteDeprecated
    },
    { status: 410 }
  );
}
