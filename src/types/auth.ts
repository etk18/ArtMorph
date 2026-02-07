import { JWTPayload } from "jose";

export type AuthTokenPayload = JWTPayload & {
  sub?: string;
  email?: string;
  role?: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};
