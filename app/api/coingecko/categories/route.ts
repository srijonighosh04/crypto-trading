import { NextRequest } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { fetchWithCache } from "@/lib/apiCache";

// --- Zod Response Validation Schema ---
const CategoryResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    market_cap: z.number().nullable().optional(),
    market_cap_change_24h: z.number().nullable().optional(),
    content: z.string().nullable().optional(),
    top_3_coins: z.array(z.string()).optional().default([]),
    volume_24h: z.number().nullable().optional(),
  })
);

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export async function GET(request: NextRequest) {
  const cacheKey = "categories";

  return fetchWithCache({
    cacheKey,
    ttlMs: CACHE_TTL,
    schema: CategoryResponseSchema,
    fetchFn: async () => {
      const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
      const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
      const coingeckoUrl = `${baseUrl}/coins/categories`;

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (config.coingecko.apiKey) {
        headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
      }

      return fetch(coingeckoUrl, {
        headers,
        next: { revalidate: 60 },
      });
    }
  });
}
