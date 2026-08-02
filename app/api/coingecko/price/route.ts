import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { fetchWithCache } from "@/lib/apiCache";

// --- Zod Response Validation Schema ---
const SimplePriceResponseSchema = z.record(z.string(), z.record(z.string(), z.number()));

const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = searchParams.get("ids");
  const vs_currencies = searchParams.get("vs_currencies");

  if (!ids || !vs_currencies) {
    return NextResponse.json(
      { error: "Missing required query parameters: ids and vs_currencies" },
      { status: 400 }
    );
  }

  // Create a sorted cache key to avoid duplicates based on param order
  const sortedIds = ids.split(",").sort().join(",");
  const sortedVs = vs_currencies.split(",").sort().join(",");
  const cacheKey = `price_${sortedIds}_${sortedVs}`;

  return fetchWithCache({
    cacheKey,
    ttlMs: CACHE_TTL,
    schema: SimplePriceResponseSchema,
    fetchFn: async () => {
      const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
      const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
      
      const coingeckoUrl = new URL(`${baseUrl}/simple/price`);
      coingeckoUrl.searchParams.set("ids", ids);
      coingeckoUrl.searchParams.set("vs_currencies", vs_currencies);

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (config.coingecko.apiKey) {
        headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
      }

      return fetch(coingeckoUrl.toString(), {
        headers,
        next: { revalidate: 30 },
      });
    }
  });
}
