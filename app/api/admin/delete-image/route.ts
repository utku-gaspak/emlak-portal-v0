import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/locale";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getListingById, updateListingById } from "@/lib/listings-store";
import { getPhotoFileName } from "@/lib/photo-path";

type DeleteImageBody = {
  propertyId?: string;
  imageIndex?: number;
};

function getExtension(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  return extension || ".jpg";
}

function getSequenceFromName(fileName: string): number {
  const baseName = path.basename(fileName, path.extname(fileName));
  const parsed = Number(baseName);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function safeSortFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const aSeq = getSequenceFromName(a);
    const bSeq = getSequenceFromName(b);

    if (aSeq !== bSeq) {
      return aSeq - bSeq;
    }

    return a.localeCompare(b);
  });
}

export async function DELETE(request: Request) {
  const t = getDictionary();

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: t.errors.authUnauthorized }, { status: 401 });
  }

  let body: DeleteImageBody = {};

  try {
    body = (await request.json()) as DeleteImageBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const propertyId = String(body.propertyId ?? "").trim();
  const imageIndex = Number(body.imageIndex);

  if (!propertyId || !Number.isInteger(imageIndex) || imageIndex < 0) {
    return NextResponse.json({ ok: false, error: "Invalid image selection." }, { status: 400 });
  }

  const listing = await getListingById(propertyId);

  if (!listing) {
    return NextResponse.json({ ok: false, error: t.errors.listingNotFound }, { status: 404 });
  }

  const listingUploadDir = path.join(process.cwd(), "public", "uploads", propertyId);

  if (!fs.existsSync(listingUploadDir)) {
    return NextResponse.json({ ok: false, error: "Photo folder not found." }, { status: 404 });
  }

  const normalizedImages = listing.images.map((image) => getPhotoFileName(image)).filter((image) => image.trim().length > 0);

  if (imageIndex >= normalizedImages.length) {
    return NextResponse.json({ ok: false, error: "Photo not found." }, { status: 404 });
  }

  const fileToDelete = normalizedImages[imageIndex];
  const deletePath = path.join(listingUploadDir, fileToDelete);

  if (fs.existsSync(deletePath)) {
    fs.unlinkSync(deletePath);
  }

  const diskFiles = safeSortFiles(
    fs
      .readdirSync(listingUploadDir)
      .filter((file) => fs.statSync(path.join(listingUploadDir, file)).isFile())
      .filter((file) => !file.startsWith(".__reindex__"))
  );

  const tempFiles = diskFiles.map((file, index) => `.__reindex__${Date.now()}_${index}${getExtension(file)}`);
  diskFiles.forEach((file, index) => {
    fs.renameSync(path.join(listingUploadDir, file), path.join(listingUploadDir, tempFiles[index]));
  });

  const reindexedPhotos = tempFiles.map((tempFile, index) => {
    const nextFileName = `${index + 1}${getExtension(tempFile)}`;
    fs.renameSync(path.join(listingUploadDir, tempFile), path.join(listingUploadDir, nextFileName));
    return nextFileName;
  });

  const updatedListing = {
    ...listing,
    images: reindexedPhotos,
    photos: reindexedPhotos
  };

  await updateListingById(propertyId, updatedListing);

  return NextResponse.json(
    {
      ok: true,
      images: reindexedPhotos
    },
    { status: 200 }
  );
}
