import { z } from "zod";

// Define schema for our environment variables
const envSchema = z.object({
  NEXT_PUBLIC_COINGECKO_API_KEY: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
});

// Validate environment variables safely
const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_COINGECKO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_API_KEY,
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
});

if (!parsedEnv.success) {
  console.error("❌ Environment validation failed:", parsedEnv.error.format());
}

const env = parsedEnv.success ? parsedEnv.data : {};

export const config = {
  coingecko: {
    // Prefer server-only key for API requests when available
    apiKey: env.COINGECKO_API_KEY || env.NEXT_PUBLIC_COINGECKO_API_KEY || "",
    isServerKey: !!env.COINGECKO_API_KEY,
    hasKey: !!(env.COINGECKO_API_KEY || env.NEXT_PUBLIC_COINGECKO_API_KEY),
  },
  env: process.env.NODE_ENV || "development",
};
