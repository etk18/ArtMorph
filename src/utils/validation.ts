import { AppError } from "../middleware/error-handler";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required`, 400);
  }
  return value.trim();
};

export const validateEmail = (value: unknown): string => {
  const email = requireString(value, "email");
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email address", 400);
  }
  return email.toLowerCase();
};

export const validatePassword = (value: unknown, minLength = 8): string => {
  const password = requireString(value, "password");
  if (password.length < minLength) {
    throw new AppError(`Password must be at least ${minLength} characters`, 400);
  }
  return password;
};

export const optionalUrl = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new AppError(`${field} must be a string`, 400);
  }
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new AppError(`${field} must be a valid URL`, 400);
  }
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateUuid = (value: unknown, field: string): string => {
  const id = requireString(value, field);
  if (!uuidRegex.test(id)) {
    throw new AppError(`${field} must be a valid UUID`, 400);
  }
  return id;
};
