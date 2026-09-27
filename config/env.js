const dotenv = require("dotenv");
const { z } = require("zod");

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: "PORT must be a valid number between 1 and 65535",
    }),
  API_PREFIX: z.string().default("/api"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000")
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default("100")
    .transform((val) => parseInt(val, 10)),
  STRICT_RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("900000")
    .transform((val) => parseInt(val, 10)),
  STRICT_RATE_LIMIT_MAX: z
    .string()
    .default("30")
    .transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

module.exports = parsedEnv.data;
