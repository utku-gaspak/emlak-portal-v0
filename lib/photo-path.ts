export function getPublicPhotoSrc(photoPath: string, listingId?: string): string {
  const normalizedPath = photoPath.replace(/^\/+/, "");

  if (normalizedPath.startsWith("uploads/")) {
    return `/${normalizedPath}`;
  }

  if (listingId) {
    return `/uploads/${listingId}/${normalizedPath}`;
  }

  return `/${normalizedPath}`;
}

export function getListingImageSrc(listingId: string, fileName: string): string {
  const normalizedFileName = getPhotoFileName(fileName);
  return `/uploads/${listingId}/${normalizedFileName}`;
}

export function getSequentialPhotoSrc(listingId: string, photoPath: string, index: number): string {
  const normalizedPath = photoPath.replace(/^\/+/, "");
  const photoFileName = getPhotoFileName(normalizedPath);
  const lastDotIndex = photoFileName.lastIndexOf(".");
  const extension = lastDotIndex >= 0 ? photoFileName.slice(lastDotIndex).toLowerCase() : ".jpg";
  return `/uploads/${listingId}/${index + 1}${extension}`;
}

export function getPhotoFileName(photoPath: string): string {
  const normalizedPath = photoPath.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");
  return segments[segments.length - 1] || normalizedPath;
}
