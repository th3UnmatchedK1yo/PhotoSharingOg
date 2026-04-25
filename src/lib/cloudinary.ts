export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  url?: string;
  [key: string]: unknown;
};

export const uploadToCloudinary = async (
  fileUri: string,
  options?: {
    fileName?: string;
    fileType?: string;
  },
): Promise<CloudinaryUploadResult> => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME");
  }

  if (!uploadPreset) {
    throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    type: options?.fileType ?? "image/jpeg",
    name: options?.fileName ?? "upload.jpg",
  } as unknown as Blob);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorBody}`);
  }

  return response.json();
};