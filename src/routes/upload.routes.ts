import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error-handler";
import { env } from "../config/env";

const router = Router();

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxBytes
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new AppError("Only PNG, JPG, and WEBP images are allowed", 400));
    }
    return cb(null, true);
  }
});

router.post("/images", requireAuth, upload.single("image"), uploadImage);

export default router;
