import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../middleware/error-handler";
import { getUserProfile, updateUserProfile, deleteUserAccount, toggleDevMode, checkGenerationLimit } from "../services/job.service";
import { changePassword, deleteAccount } from "../services/auth.service";
import { validatePassword } from "../utils/validation";
import { prisma } from "../config/prisma";

async function ensureProfile(userId: string, email?: string) {
  const existing = await prisma.userProfile.findUnique({ where: { id: userId } });
  if (!existing) {
    await prisma.userProfile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: email ?? null,
        displayName: email?.split("@")[0] ?? null
      }
    });
  }
}

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  // Ensure profile exists (handles race condition from non-blocking signup)
  await ensureProfile(req.user.id, req.user.email);

  const profile = await getUserProfile(req.user.id);

  res.status(200).json({
    status: "ok",
    profile
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const displayName =
    typeof req.body.displayName === "string"
      ? req.body.displayName.trim().slice(0, 100)
      : undefined;

  const age =
    typeof req.body.age === "number"
      ? Math.max(1, Math.min(150, Math.floor(req.body.age)))
      : req.body.age === null
        ? null
        : undefined;

  const gender =
    typeof req.body.gender === "string"
      ? req.body.gender.trim().slice(0, 30)
      : req.body.gender === null
        ? null
        : undefined;

  const bio =
    typeof req.body.bio === "string"
      ? req.body.bio.trim().slice(0, 300)
      : req.body.bio === null
        ? null
        : undefined;

  const profile = await updateUserProfile(req.user.id, {
    displayName,
    age,
    gender,
    bio
  });

  res.status(200).json({
    status: "ok",
    profile
  });
});

export const changePasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const currentPassword =
      typeof req.body.currentPassword === "string"
        ? req.body.currentPassword
        : "";
    if (!currentPassword) {
      throw new AppError("Current password is required", 400);
    }

    const newPassword = validatePassword(req.body.newPassword);

    if (currentPassword === newPassword) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    await changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      status: "ok",
      message: "Password changed successfully"
    });
  }
);

export const deleteAccountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const confirmation = req.body.confirmation;
    if (confirmation !== "DELETE") {
      throw new AppError(
        'Please type "DELETE" to confirm account deletion',
        400
      );
    }

    // Delete all user data from database
    await deleteUserAccount(req.user.id);

    // Delete user from Supabase Auth
    await deleteAccount(req.user.id);

    res.status(200).json({
      status: "ok",
      message: "Account deleted successfully"
    });
  }
);

export const toggleDevModeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const passkey =
      typeof req.body.passkey === "string" ? req.body.passkey : "";
    const activate = req.body.activate !== false; // default true

    if (!passkey) {
      throw new AppError("Passkey is required", 400);
    }

    const result = await toggleDevMode(req.user.id, passkey, activate);

    res.status(200).json({
      status: "ok",
      ...result
    });
  }
);

export const getGenerationLimitHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    await ensureProfile(req.user.id, req.user.email);
    const limit = await checkGenerationLimit(req.user.id);

    res.status(200).json({
      status: "ok",
      ...limit
    });
  }
);
