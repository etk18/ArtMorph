import { createRemoteJWKSet, jwtVerify, JWTPayload, decodeProtectedHeader } from "jose";
import { env } from "../config/env";
import { AppError } from "../middleware/error-handler";

const jwtSecret = new TextEncoder().encode(env.supabaseJwtSecret);

// Setup Remote JWKS for Asymmetric Keys (ES256, RS256)
// Supabase Auth v1 JWKS URL
const jwksUrl = new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(jwksUrl);

export type VerifyJwtOptions = {
  audience?: string | string[];
};

export const verifyJwt = async (
  token: string,
  options?: VerifyJwtOptions
): Promise<JWTPayload> => {
  try {
    const header = decodeProtectedHeader(token);
    const alg = header.alg;

    let key: any = jwtSecret;
    // If not HS256, assuming it's an asymmetric key from Supabase (RS256 or ES256)
    if (alg !== "HS256") {
      key = JWKS;
    }

    const { payload } = await jwtVerify(token, key, {
      algorithms: alg ? [alg] : undefined,
      audience: options?.audience ?? env.supabaseJwtAudience,
      issuer: env.supabaseJwtIssuer || undefined
    });

    return payload;
  } catch (error) {
    console.error("[JWT] Verification failed:", (error as Error).message);
    throw new AppError("Unauthorized", 401);
  }
};
