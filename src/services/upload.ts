import { uploadToCloudinary } from "../lib/cloudinary";

export type UploadedStampImage = {
  imageUrl: string;
  publicId: string;
};

export type UploadedProfileImage = {
  imageUrl: string;
  publicId: string;
};

export type UploadedEditorImage = {
  imageUrl: string;
  publicId: string;
};

export async function uploadStampImage(
  localUri: string,
): Promise<UploadedStampImage> {
  const result = await uploadToCloudinary(localUri, {
    fileName: "stamp.jpg",
    fileType: "image/jpeg",
  });

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload returned incomplete data.");
  }

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
  };
}

export async function uploadEditorImage(
  localUri: string,
): Promise<UploadedEditorImage> {
  const result = await uploadToCloudinary(localUri, {
    fileName: "editor-image.jpg",
    fileType: "image/jpeg",
  });

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload returned incomplete data.");
  }

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
  };
}

export async function uploadProfileImage(
  localUri: string,
): Promise<UploadedProfileImage> {
  const result = await uploadToCloudinary(localUri, {
    fileName: "profile-avatar.jpg",
    fileType: "image/jpeg",
  });

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload returned incomplete data.");
  }

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
  };
}
