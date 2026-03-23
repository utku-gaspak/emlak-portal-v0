export function getOptimizedCloudinaryUrl(imageUrl: string, width = 1000): string {
  if (!imageUrl.includes("res.cloudinary.com")) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const uploadSegment = "/upload/";
    const uploadIndex = url.pathname.indexOf(uploadSegment);

    if (uploadIndex === -1) {
      return imageUrl;
    }

    const prefix = url.pathname.slice(0, uploadIndex + uploadSegment.length);
    const suffix = url.pathname.slice(uploadIndex + uploadSegment.length);
    const transform = `f_auto,q_auto,w_${width},c_fill`;

    if (suffix.startsWith(`${transform}/`)) {
      return imageUrl;
    }

    url.pathname = `${prefix}${transform}/${suffix}`;
    return url.toString();
  } catch {
    return imageUrl;
  }
}
