import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z
    .string()
    .min(16, "El secret JWT debe ser de almenos 16 caracteres"),
  SERVER_PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
