import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/locale";
import path from "node:path";
import { existsSync, rmSync } from "node:fs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { removeListingById } from "@/lib/listings-store";

const publicDir = path.join(process.cwd(), "public");

type DeleteListingRouteProps = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: DeleteListingRouteProps) {
  const t = getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const deletedListing = await removeListingById(params.id);

  if (!deletedListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  const listingUploadDir = path.join(publicDir, "uploads", params.id);
  if (existsSync(listingUploadDir)) {
    rmSync(listingUploadDir, { recursive: true });
  }

  return NextResponse.json(
    {
      ok: true,
      deletedId: params.id
    },
    { status: 200 }
  );
}
