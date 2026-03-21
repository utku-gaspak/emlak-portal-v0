import { NextResponse } from "next/server";
import { getListings } from "@/lib/listings-store";

export async function GET() {
  const listings = await getListings();
  return NextResponse.json({ ok: true, listings });
}
