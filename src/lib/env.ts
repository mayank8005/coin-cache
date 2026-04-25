import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_SESSION_MAX_AGE: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  ADMIN_PASSWORD_HASH: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
  ENCRYPTION_KEY: z.string().min(16),
  LLM_BASE_URL: z.string().url().optional().or(z.literal("")),
  LLM_API_KEY: z.string().optional().default(""),
  LLM_MODEL: z.string().optional().default(""),
  LLM_HEALTH_TIMEOUT_MS: z.coerce.number().int().positive().default(1500),
});

export type AppEnv = z.infer<typeof EnvSchema>;

// Next.js page-data collection runs during `next build` and imports route
// modules, which transitively call env(). Real secrets aren't (and shouldn't
// be) baked into the image, so during the build phase we satisfy the schema
// with obvious placeholders. Runtime is a fresh process and reads real values
// from the docker-compose env_file.
const BUILD_PLACEHOLDERS: Record<string, string> = {
  DATABASE_URL: "file:/tmp/build.db",
  AUTH_SECRET: "build-time-placeholder-replaced-at-runtime",
  ENCRYPTION_KEY: "build-time-placeholder-replaced-at-runtime",
};

let cached: AppEnv | null = null;

export const env = (): AppEnv => {
  if (cached) return cached;
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const source = isBuildPhase ? { ...BUILD_PLACEHOLDERS, ...process.env } : process.env;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  return cached;
};
