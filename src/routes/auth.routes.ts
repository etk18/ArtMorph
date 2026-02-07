import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  resendVerificationEmail,
  resetPasswordWithToken,
  signup
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithToken);
router.get("/me", requireAuth, getMe);

export default router;
