import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV ?? "development";
const cookieSameSite = (process.env.AUTH_COOKIE_SAMESITE ?? "lax") as
  | "lax"
  | "strict"
  | "none";
const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
  supabaseJwtSecret: requireEnv("SUPABASE_JWT_SECRET"),
  supabaseJwtIssuer: process.env.SUPABASE_JWT_ISSUER ?? "",
  supabaseJwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? "authenticated",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "uploaded_images",
  supabaseGeneratedBucket: process.env.SUPABASE_GENERATED_BUCKET ?? "generated_images",
  uploadMaxBytes: parseNumber(process.env.UPLOAD_MAX_BYTES, 10 * 1024 * 1024),
  previewUrlTtlSeconds: parseNumber(process.env.PREVIEW_URL_TTL_SECONDS, 600),
  generatedUrlTtlSeconds: parseNumber(process.env.GENERATED_URL_TTL_SECONDS, 600),
  hfApiToken: process.env.HF_API_TOKEN ?? "",
  hfDefaultModel: process.env.HF_DEFAULT_MODEL ?? "black-forest-labs/FLUX.1-Kontext-dev",
  hfDefaultSpace: process.env.HF_DEFAULT_SPACE ?? "black-forest-labs/FLUX.1-Kontext-Dev",
  hfRequestTimeoutMs: parseNumber(process.env.HF_REQUEST_TIMEOUT_MS, 180000),
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",
  devPasskey: process.env.DEV_PASSKEY ?? "artmorph-dev-2026",
  freeGenerationLimit: parseNumber(process.env.FREE_GENERATION_LIMIT, 5),
  authCookieName: process.env.AUTH_COOKIE_NAME ?? "artmorph_refresh",
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  authCookieSameSite: cookieSameSite,
  authCookieSecure:
    process.env.AUTH_COOKIE_SECURE === "true" ||
    (process.env.AUTH_COOKIE_SECURE !== "false" && nodeEnv === "production")
};
