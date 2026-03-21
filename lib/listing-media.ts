import path from "node:path";
import { existsSync, mkdirSync, unlinkSync, renameSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";

const publicDir = path.join(process.cwd(), "public");

export function ensurePublicDirectory(): void {
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
}

export function getListingUploadDir(listingId: string): string {
  ensurePublicDirectory();
  return path.join(publicDir, "uploads", listingId);
}

export function ensureListingUploadDir(listingId: string): string {
  const listingUploadDir = getListingUploadDir(listingId);

  if (!existsSync(listingUploadDir)) {
    mkdirSync(listingUploadDir, { recursive: true });
  }

  return listingUploadDir;
}

export function sanitizeFileName(fileName: string, index: number): string {
  const extension = path.extname(fileName).toLowerCase();
  const safeExtension = extension.replace(/[^.a-z0-9]/g, "");

  return `${index + 1}${safeExtension || ".jpg"}`;
}

export async function saveUploadedPhotos(listingId: string, files: File[], startIndex = 0): Promise<string[]> {
  const listingUploadDir = ensureListingUploadDir(listingId);

  return Promise.all(
    files.map((file, index) => saveUploadedPhoto(listingUploadDir, file, startIndex + index))
  );
}

export async function saveUploadedPhoto(listingUploadDir: string, file: File, index: number): Promise<string> {
  const safeFileName = sanitizeFileName(file.name, index);
  const targetPath = path.join(listingUploadDir, safeFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(targetPath, buffer);
  return safeFileName;
}

export async function deleteListingUploadDir(listingId: string): Promise<void> {
  const listingUploadDir = getListingUploadDir(listingId);
  await rm(listingUploadDir, { recursive: true, force: true });
}

export async function deleteUploadedFiles(listingId: string, fileNames: string[]): Promise<void> {
  await Promise.all(
    fileNames.map(async (fileName) => {
      await rm(path.join(publicDir, "uploads", listingId, fileName), { force: true });
    })
  );
}

export function deleteAndReindexListingPhoto(listingId: string, photos: string[], deletedIndex: number): string[] {
  const listingUploadDir = getListingUploadDir(listingId);
  const normalizedPhotos = photos.map((photo) => path.basename(photo));
  const photoToDelete = normalizedPhotos[deletedIndex];

  if (!photoToDelete) {
    return normalizedPhotos;
  }

  const deletePath = path.join(listingUploadDir, photoToDelete);
  if (existsSync(deletePath)) {
    unlinkSync(deletePath);
  }

  const remainingPhotos = normalizedPhotos.filter((_, index) => index !== deletedIndex);

  return remainingPhotos.map((photo, index) => {
    const extension = path.extname(photo).toLowerCase() || ".jpg";
    const nextFileName = `${index + 1}${extension}`;
    const currentPath = path.join(listingUploadDir, photo);
    const nextPath = path.join(listingUploadDir, nextFileName);

    if (photo !== nextFileName && existsSync(currentPath)) {
      renameSync(currentPath, nextPath);
    }

    return nextFileName;
  });
}
