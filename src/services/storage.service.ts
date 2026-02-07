import { randomUUID } from "crypto";
import path from "path";
import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";

const mimeToExt: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp"
};

export type StorageUploadResult = {
  bucket: string;
  path: string;
  previewUrl: string;
};

export const uploadUserImage = async (
  userId: string,
  file: Express.Multer.File
): Promise<StorageUploadResult> => {
  const bucket = env.supabaseStorageBucket;
  const ext = mimeToExt[file.mimetype] ?? path.extname(file.originalname) ?? "";
  const objectPath = `users/${userId}/uploads/${randomUUID()}${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new AppError("Failed to upload image", 500);
  }

  const { data, error: signedError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(objectPath, env.previewUrlTtlSeconds);

  if (signedError || !data?.signedUrl) {
    throw new AppError("Failed to generate preview URL", 500);
  }

  return {
    bucket,
    path: objectPath,
    previewUrl: data.signedUrl
  };
};
