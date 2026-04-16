import { uploadToCloudinary } from "../lib/cloudinary";

export type UploadedStampImage = {
  imageUrl: string;
  publicId: string;
};

export async function uploadStampImage(
  localUri: string
): Promise<UploadedStampImage> {
  const result = await uploadToCloudinary(localUri);

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload returned incomplete data.");
  }

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
  };
}