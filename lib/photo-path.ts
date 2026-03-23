export function getPublicPhotoSrc(photoPath: string, listingId?: string): string {
  const normalizedPath = photoPath.replace(/\\/g, "/").trim();

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  const withoutLeadingSlash = normalizedPath.replace(/^\/+/, "");

  if (withoutLeadingSlash.startsWith("uploads/")) {
    return `/${withoutLeadingSlash}`;
  }

  if (listingId) {
    return `/uploads/${listingId}/${withoutLeadingSlash}`;
  }

  return `/${withoutLeadingSlash}`;
}

export function getListingImageSrc(listingId: string, fileName: string): string {
  return getPublicPhotoSrc(fileName, listingId);
}

export function getSequentialPhotoSrc(listingId: string, photoPath: string, index: number): string {
  const normalizedPath = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

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
