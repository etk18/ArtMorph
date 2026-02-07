import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createGenerationJob,
  deleteGenerationJob,
  getGenerationJob,
  getGenerationJobHistory,
  getUserJobs,
  retryGenerationJob
} from "../controllers/job.controller";

const router = Router();

router.get("/", requireAuth, getUserJobs);
router.post("/", requireAuth, createGenerationJob);
router.get("/:id", requireAuth, getGenerationJob);
router.get("/:id/history", requireAuth, getGenerationJobHistory);
router.post("/:id/retry", requireAuth, retryGenerationJob);
router.delete("/:id", requireAuth, deleteGenerationJob);

export default router;
