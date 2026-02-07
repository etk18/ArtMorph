import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import {
  refreshSession,
  resendVerification,
  resetPassword,
  sendPasswordResetEmail,
  signInWithPassword,
  signOut,
  signUp
} from "../services/auth.service";
import {
  optionalUrl,
  requireString,
  validateEmail,
  validatePassword
} from "../utils/validation";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../utils/cookies";
import { AppError } from "../middleware/error-handler";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { verifyJwt } from "../utils/jwt";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const emailRedirectTo = optionalUrl(req.body.emailRedirectTo, "emailRedirectTo");

  const { user, session } = await signUp({
    email,
    password,
    emailRedirectTo
  });

  if (user) {
    // Create local profile — non-blocking so signup still succeeds even if DB is slow
    prisma.userProfile.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        displayName: user.email?.split("@")[0]
      }
    }).catch((err) => {
      console.error("Failed to create profile during signup (will retry on login):", err);
    });
  }

  if (session?.refresh_token) {
    setRefreshTokenCookie(res, session.refresh_token);
  }

  res.status(201).json({
    status: "ok",
    user: user ? { id: user.id, email: user.email } : null,
    accessToken: session?.access_token ?? null,
    expiresAt: session?.expires_at ?? null,
    needsEmailVerification: !session
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password, 1);

  const { user, session } = await signInWithPassword({ email, password });

  if (!user || !session) {
    throw new AppError("Invalid credentials", 401);
  }

  // Ensure profile exists on login
  await prisma.userProfile.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      displayName: user.email?.split("@")[0]
    }
  });

  if (session.refresh_token) {
    setRefreshTokenCookie(res, session.refresh_token);
  }

  res.status(200).json({
    status: "ok",
    user: { id: user.id, email: user.email },
    accessToken: session.access_token,
    expiresAt: session.expires_at
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.token) {
    throw new AppError("Missing access token", 401);
  }

  const refreshToken = req.cookies?.[env.authCookieName];
  if (refreshToken) {
    await signOut(req.auth.token, refreshToken);
  }

  clearRefreshTokenCookie(res);

  res.status(200).json({
    status: "ok"
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[env.authCookieName];
  if (!refreshToken) {
    throw new AppError("Missing refresh token", 401);
  }

  const { user, session } = await refreshSession(refreshToken);

  if (!user || !session) {
    throw new AppError("Invalid or expired session", 401);
  }

  if (session.refresh_token) {
    setRefreshTokenCookie(res, session.refresh_token);
  }

  res.status(200).json({
    status: "ok",
    user: { id: user.id, email: user.email },
    accessToken: session.access_token,
    expiresAt: session.expires_at
  });
});

export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const email = validateEmail(req.body.email);
    const emailRedirectTo = optionalUrl(
      req.body.emailRedirectTo,
      "emailRedirectTo"
    );

    await resendVerification(email, emailRedirectTo);

    res.status(200).json({
      status: "ok"
    });
  }
);

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const email = validateEmail(req.body.email);
  const redirectTo = optionalUrl(req.body.redirectTo, "redirectTo");

  await sendPasswordResetEmail(email, redirectTo);

  res.status(200).json({
    status: "ok"
  });
});

export const resetPasswordWithToken = asyncHandler(
  async (req: Request, res: Response) => {
    const accessToken = requireString(req.body.accessToken, "accessToken");
    const newPassword = validatePassword(req.body.newPassword);

    const payload = await verifyJwt(accessToken, {
      audience: ["recovery", env.supabaseJwtAudience]
    });
    if (!payload.sub) {
      throw new AppError("Invalid access token", 401);
    }

    await resetPassword(payload.sub, newPassword);

    res.status(200).json({
      status: "ok"
    });
  }
);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  res.status(200).json({
    status: "ok",
    user: req.user
  });
});
