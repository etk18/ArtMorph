import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../middleware/error-handler";
import { uploadUserImage } from "../services/storage.service";
import { prisma } from "../config/prisma";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const file = req.file;
  if (!file) {
    throw new AppError("Image file is required", 400);
  }

  const uploadResult = await uploadUserImage(req.user.id, file);

  const record = await prisma.uploadedImage.create({
    data: {
      userId: req.user.id,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageBucket: uploadResult.bucket,
      storagePath: uploadResult.path
    }
  });

  res.status(201).json({
    status: "ok",
    image: {
      id: record.id,
      storageBucket: record.storageBucket,
      storagePath: record.storagePath,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      createdAt: record.createdAt
    },
    previewUrl: uploadResult.previewUrl
  });
});
