import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { fetchWithCache } from "@/lib/apiCache";

// --- Zod Response Validation Schema ---
// CoinGecko OHLC returns an array of [timestamp, open, high, low, close]
const OhlcResponseSchema = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
);

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const vs_currency = searchParams.get("vs_currency") || "usd";
  const days = searchParams.get("days") || "30";

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400 }
    );
  }

  // Create cache key
  const cacheKey = `ohlc_${id}_${vs_currency}_${days}`;

  return fetchWithCache({
    cacheKey,
    ttlMs: CACHE_TTL,
    schema: OhlcResponseSchema,
    fetchFn: async () => {
      const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
      const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
      
      const coingeckoUrl = new URL(`${baseUrl}/coins/${id}/ohlc`);
      coingeckoUrl.searchParams.set("vs_currency", vs_currency);
      coingeckoUrl.searchParams.set("days", days);

      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (config.coingecko.apiKey) {
        headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
      }

      return fetch(coingeckoUrl.toString(), {
        headers,
        next: { revalidate: 60 },
      });
    }
  });
}
