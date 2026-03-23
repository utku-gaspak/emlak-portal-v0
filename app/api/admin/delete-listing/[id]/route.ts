import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/get-dictionary";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { removeListingById } from "@/lib/listings-store";
import { deleteUploadedFiles } from "@/lib/listing-media";

type DeleteListingRouteProps = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: DeleteListingRouteProps) {
  const t = await getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  const deletedListing = await removeListingById(params.id);

  if (!deletedListing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  await deleteUploadedFiles(params.id, deletedListing.images);

  return NextResponse.json(
    {
      ok: true,
      deletedId: params.id
    },
    { status: 200 }
  );
}
