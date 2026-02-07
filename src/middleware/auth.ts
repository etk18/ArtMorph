import { NextFunction, Request, Response } from "express";
import { AppError } from "./error-handler";
import { verifyJwt } from "../utils/jwt";
import { asyncHandler } from "../utils/async-handler";

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
};

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) {
      console.log("[Auth] No token found in headers:", req.headers);
      throw new AppError("Missing Authorization header", 401);
    }

    // console.log("[Auth] Verifying token:", token.substring(0, 15) + "...");
    const payload = await verifyJwt(token);

    if (!payload.sub) {
      throw new AppError("Invalid token", 401);
    }

    req.user = {
      id: payload.sub,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined
    };

    req.auth = {
      token,
      payload
    };

    next();
  }
);
