import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const dataPath = path.join(process.cwd(), "data", "listings.json");
const uploadsRoot = path.join(process.cwd(), "public", "uploads");

function uploadBuffer(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
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

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

const raw = await fs.readFile(dataPath, "utf8");
const listings = JSON.parse(raw);
const migrated = [];

for (const listing of listings) {
  const images = Array.isArray(listing.images) ? listing.images : [];

  if (images.length === 0 || images.every((image) => typeof image === "string" && /^https?:\/\//i.test(image))) {
    migrated.push(listing);
    continue;
  }

  const listingFolder = path.join(uploadsRoot, listing.id);
  const secureUrls = [];

  for (let index = 0; index < images.length; index += 1) {
    const fileName = String(images[index]);
    const localPath = path.join(listingFolder, fileName);

    if (!existsSync(localPath)) {
      throw new Error(`Missing local file: ${localPath}`);
    }

    const buffer = await fs.readFile(localPath);
    const result = await uploadBuffer(buffer, `real-estate-listings/${listing.id}`, String(index + 1));
    secureUrls.push(result.secure_url);
  }

  migrated.push({
    ...listing,
    images: secureUrls,
    photos: secureUrls
  });
}

await fs.writeFile(dataPath, JSON.stringify(migrated, null, 2), "utf8");

if (existsSync(uploadsRoot)) {
  await fs.rm(uploadsRoot, { recursive: true, force: true });
}

console.log("Cloudinary migration complete.");
