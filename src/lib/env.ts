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

let cached: AppEnv | null = null;

export const env = (): AppEnv => {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  cached = parsed.data;
  return cached;
};
