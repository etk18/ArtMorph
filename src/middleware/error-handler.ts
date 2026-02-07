import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File exceeds maximum size"
        : err.message;
    res.status(400).json({
      status: "error",
      message
    });
    return;
  }
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : "Internal Server Error";

  const payload: Record<string, unknown> = {
    status: "error",
    message
  };

  // Log all 500 errors or non-operational errors
  if (!isAppError || statusCode >= 500) {
    console.error("[ErrorHandler]", err);
  }

  if (env.nodeEnv !== "production") {
    payload.stack = err instanceof Error ? err.stack : undefined;
    if (!isAppError) {
      payload.details = err instanceof Error ? err.message : err;
    }
  }

  res.status(statusCode).json(payload);
};
