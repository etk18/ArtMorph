import { Router } from "express";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import uploadRoutes from "./upload.routes";
import styleRoutes from "./style.routes";
import jobRoutes from "./job.routes";
import profileRoutes from "./profile.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/uploads", uploadRoutes);
router.use("/styles", styleRoutes);
router.use("/jobs", jobRoutes);
router.use("/profile", profileRoutes);

export default router;
