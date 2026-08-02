import { NextRequest } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { fetchWithCache } from "@/lib/apiCache";

// --- Zod Response Validation Schema ---
const CoinMarketResponseSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    image: z.string(),
    current_price: z.number(),
    market_cap: z.number(),
    market_cap_rank: z.number(),
    fully_diluted_valuation: z.number().nullable().optional(),
    total_volume: z.number(),
    high_24h: z.number().nullable().optional(),
    low_24h: z.number().nullable().optional(),
    price_change_24h: z.number().nullable().optional(),
    price_change_percentage_24h: z.number().nullable().optional(),
    market_cap_change_24h: z.number().nullable().optional(),
    market_cap_change_percentage_24h: z.number().nullable().optional(),
    circulating_supply: z.number().nullable().optional(),
    total_supply: z.number().nullable().optional(),
    max_supply: z.number().nullable().optional(),
    ath: z.number().nullable().optional(),
    ath_change_percentage: z.number().nullable().optional(),
    ath_date: z.string().nullable().optional(),
    atl: z.number().nullable().optional(),
    atl_change_percentage: z.number().nullable().optional(),
    atl_date: z.string().nullable().optional(),
    last_updated: z.string().nullable().optional(),
  })
);

const CACHE_TTL = 45 * 1000; // 45 seconds cache TTL

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const vs_currency = searchParams.get("vs_currency") || "usd";
  const order = searchParams.get("order") || "market_cap_desc";
  const per_page = searchParams.get("per_page") || "100";
  const page = searchParams.get("page") || "1";
  const price_change_percentage = searchParams.get("price_change_percentage") || "24h";
  const category = searchParams.get("category");
  const ids = searchParams.get("ids");

  // Create a cache key from parameters
  const cacheKey = `markets_${vs_currency}_${order}_${per_page}_${page}_${price_change_percentage}_${category || ""}_${ids || ""}`;

  return fetchWithCache({
    cacheKey,
    ttlMs: CACHE_TTL,
    schema: CoinMarketResponseSchema,
    fetchFn: async () => {
      const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
      const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";

      const coingeckoUrl = new URL(`${baseUrl}/coins/markets`);
      coingeckoUrl.searchParams.set("vs_currency", vs_currency);
      coingeckoUrl.searchParams.set("order", order);
      coingeckoUrl.searchParams.set("per_page", per_page);
      coingeckoUrl.searchParams.set("page", page);
      coingeckoUrl.searchParams.set("sparkline", "false");
      
      if (price_change_percentage) {
        coingeckoUrl.searchParams.set("price_change_percentage", price_change_percentage);
      }

      if (category) {
        coingeckoUrl.searchParams.set("category", category);
      }

      if (ids) {
        coingeckoUrl.searchParams.set("ids", ids);
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (config.coingecko.apiKey) {
        headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
      }

      return fetch(coingeckoUrl.toString(), {
        headers,
        next: { revalidate: 45 },
      });
    }
  });
}
