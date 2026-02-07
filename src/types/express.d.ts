import { AuthTokenPayload, AuthUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      auth?: {
        token: string;
        payload: AuthTokenPayload;
      };
    }
  }
}

export {};
