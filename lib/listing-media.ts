import { deleteCloudinaryImage, renameCloudinaryImage, uploadListingImages } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";

function getSupabaseStoragePathFromUrl(imageUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(imageUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

    if (!match) {
      return null;
    }

    return {
      bucket: match[1],
      path: decodeURIComponent(match[2])
    };
  } catch {
    return null;
  }
}

async function deleteImageByUrl(imageUrl: string): Promise<void> {
  const supabaseStorage = getSupabaseStoragePathFromUrl(imageUrl);

  if (supabaseStorage) {
    await supabase.storage.from(supabaseStorage.bucket).remove([supabaseStorage.path]);
    return;
  }

  await deleteCloudinaryImage(imageUrl);
}

export async function saveUploadedPhotos(listingId: string, files: File[], startIndex = 0): Promise<string[]> {
  const uploadedImages = await uploadListingImages(listingId, files, startIndex);
  return uploadedImages.map((image) => image.secure_url);
}

export async function deleteUploadedFiles(_listingId: string, imageUrls: string[]): Promise<void> {
  await Promise.all(imageUrls.map((imageUrl) => deleteImageByUrl(imageUrl)));
}

export async function deleteAndReindexListingPhoto(listingId: string, images: string[], deletedIndex: number): Promise<string[]> {
  const normalizedImages = images.map((image) => image.trim()).filter((image) => image.length > 0);
  const imageToDelete = normalizedImages[deletedIndex];

  if (!imageToDelete) {
    return normalizedImages;
  }

  await deleteImageByUrl(imageToDelete);

  const remainingImages = normalizedImages.filter((_, index) => index !== deletedIndex);
  const reindexedImages: string[] = [];
  let cloudinaryIndex = 0;

  for (const imageUrl of remainingImages) {
    if (getSupabaseStoragePathFromUrl(imageUrl)) {
      reindexedImages.push(imageUrl);
      continue;
    }

    const renamedImage = await renameCloudinaryImage(imageUrl, listingId, cloudinaryIndex);
    reindexedImages.push(renamedImage.secure_url);
    cloudinaryIndex += 1;
  }

  return reindexedImages;
}