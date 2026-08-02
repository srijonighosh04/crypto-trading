import { NextRequest } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { fetchWithCache } from "@/lib/apiCache";

// --- Zod Response Validation Schema ---
const TrendingCoinItemSchema = z.object({
  id: z.string(),
  coin_id: z.number(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: z.number(),
  thumb: z.string(),
  large: z.string(),
  slug: z.string(),
  price_btc: z.number(),
  score: z.number(),
  data: z.object({
    price: z.union([z.string(), z.number()]),
    price_btc: z.string(),
    price_change_percentage_24h: z.record(z.string(), z.number()),
    market_cap: z.string(),
    market_cap_btc: z.string(),
    total_volume: z.string(),
    total_volume_btc: z.string(),
    sparkline: z.string().optional(),
  }),
});

const TrendingResponseSchema = z.object({
  coins: z.array(z.object({
    item: TrendingCoinItemSchema,
  })),
  nfts: z.array(z.any()).optional().default([]),
  categories: z.array(z.any()).optional().default([]),
});

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export async function GET(request: NextRequest) {
  const cacheKey = "trending_now";

  return fetchWithCache({
    cacheKey,
    ttlMs: CACHE_TTL,
    schema: TrendingResponseSchema,
    fetchFn: async () => {
      const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
      const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
      const coingeckoUrl = `${baseUrl}/search/trending`;

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
