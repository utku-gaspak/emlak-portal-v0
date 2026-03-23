import { v2 as cloudinary } from "cloudinary";
import { Writable } from "node:stream";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export const LISTING_MEDIA_FOLDER = "real-estate-listings";

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
};

type CloudinaryRenameResult = {
  public_id: string;
  secure_url: string;
};

export function getListingFolder(listingId: string): string {
  return `${LISTING_MEDIA_FOLDER}/${listingId}`;
}

export function getListingPublicId(listingId: string, index: number): string {
  return `${getListingFolder(listingId)}/${index + 1}`;
}

export function getCloudinaryPublicIdFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const uploadSegment = "/upload/";
    const uploadIndex = url.pathname.indexOf(uploadSegment);

    if (uploadIndex === -1) {
      return null;
    }

    const rawPath = decodeURIComponent(url.pathname.slice(uploadIndex + uploadSegment.length));
    const segments = rawPath.split("/").filter(Boolean);
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const normalizedSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;

    if (normalizedSegments.length === 0) {
      return null;
    }

    const fileName = normalizedSegments[normalizedSegments.length - 1];
    const publicIdTail = fileName.replace(/\.[^.]+$/, "");
    const baseSegments = normalizedSegments.slice(0, -1);

    return [...baseSegments, publicIdTail].join("/");
  } catch {
    return null;
  }
}

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

export function uploadListingImage(listingId: string, file: File, index: number): Promise<CloudinaryUploadResult> {
  const folder = getListingFolder(listingId);
  const publicId = String(index + 1);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        unique_filename: false,
        use_filename: false
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result as CloudinaryUploadResult);
      }
    );

    file
      .arrayBuffer()
      .then((buffer) => {
        const writable = uploadStream as unknown as Writable;
        writable.end(Buffer.from(buffer));
      })
      .catch((error) => {
        reject(error instanceof Error ? error : new Error("Failed to read file buffer."));
      });
  });
}

export async function uploadListingImages(listingId: string, files: File[], startIndex = 0): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const result = await uploadListingImage(listingId, files[index], startIndex + index);
      results.push(result);
    }

    return results;
  } catch (error) {
    await deleteCloudinaryImages(results.map((item) => item.secure_url));
    throw error;
  }
}

export async function deleteCloudinaryImage(imageUrl: string): Promise<void> {
  const publicId = getCloudinaryPublicIdFromUrl(imageUrl);

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true
  });
}

export async function deleteCloudinaryImages(imageUrls: string[]): Promise<void> {
  await Promise.all(imageUrls.map((imageUrl) => deleteCloudinaryImage(imageUrl)));
}

export async function renameCloudinaryImage(imageUrl: string, listingId: string, nextIndex: number): Promise<CloudinaryRenameResult> {
  const currentPublicId = getCloudinaryPublicIdFromUrl(imageUrl);
  const nextPublicId = getListingPublicId(listingId, nextIndex);

  if (!currentPublicId) {
    return {
      public_id: nextPublicId,
      secure_url: imageUrl
    };
  }

  if (currentPublicId === nextPublicId) {
    return {
      public_id: currentPublicId,
      secure_url: imageUrl
    };
  }

  const result = await cloudinary.uploader.rename(currentPublicId, nextPublicId, {
    overwrite: true,
    resource_type: "image"
  });

  return result as CloudinaryRenameResult;
}

export async function deleteCloudinaryFolder(listingId: string): Promise<void> {
  const folder = getListingFolder(listingId);
  await cloudinary.api.delete_resources_by_prefix(folder, {
    resource_type: "image"
  });
}

export { cloudinary };
