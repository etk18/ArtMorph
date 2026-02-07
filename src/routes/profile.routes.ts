import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getProfile,
  updateProfile,
  changePasswordHandler,
  deleteAccountHandler,
  toggleDevModeHandler,
  getGenerationLimitHandler
} from "../controllers/profile.controller";

const router = Router();

router.get("/", requireAuth, getProfile);
router.patch("/", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePasswordHandler);
router.post("/dev-mode", requireAuth, toggleDevModeHandler);
router.get("/generation-limit", requireAuth, getGenerationLimitHandler);
router.delete("/", requireAuth, deleteAccountHandler);

export default router;
