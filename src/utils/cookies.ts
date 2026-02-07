import { Response } from "express";
import { env } from "../config/env";

const baseOptions = {
  httpOnly: true,
  secure: env.authCookieSecure,
  sameSite: env.authCookieSameSite,
  domain: env.authCookieDomain,
  path: "/"
} as const;

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(env.authCookieName, refreshToken, baseOptions);
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(env.authCookieName, baseOptions);
};
