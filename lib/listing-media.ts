import { deleteCloudinaryFolder, deleteCloudinaryImage, deleteCloudinaryImages, renameCloudinaryImage, uploadListingImages } from "@/lib/cloudinary";

export async function saveUploadedPhotos(listingId: string, files: File[], startIndex = 0): Promise<string[]> {
  const uploadedImages = await uploadListingImages(listingId, files, startIndex);
  return uploadedImages.map((image) => image.secure_url);
}

export async function deleteUploadedFiles(_listingId: string, imageUrls: string[]): Promise<void> {
  await deleteCloudinaryImages(imageUrls);
}

export async function deleteAndReindexListingPhoto(listingId: string, images: string[], deletedIndex: number): Promise<string[]> {
  const normalizedImages = images.map((image) => image.trim()).filter((image) => image.length > 0);
  const imageToDelete = normalizedImages[deletedIndex];

  if (!imageToDelete) {
    return normalizedImages;
  }

  await deleteCloudinaryImage(imageToDelete);

  const remainingImages = normalizedImages.filter((_, index) => index !== deletedIndex);
  const reindexedImages: string[] = [];

  for (let index = 0; index < remainingImages.length; index += 1) {
    const imageUrl = remainingImages[index];
    const renamedImage = await renameCloudinaryImage(imageUrl, listingId, index);
    reindexedImages.push(renamedImage.secure_url);
  }

  return reindexedImages;
}
