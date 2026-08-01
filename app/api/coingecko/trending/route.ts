import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";

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

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cacheMap = (globalThis as any).coingeckoTrendingCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).coingeckoTrendingCache = cacheMap;
}

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export async function GET(request: NextRequest) {
  const cacheKey = "trending_now";

  // Check cache
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Proxy Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cached.data, {
      headers: {
        "x-cache-status": "HIT",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  console.log(`[Proxy Cache] MISS for key: ${cacheKey}. Fetching from CoinGecko...`);

  // Build CoinGecko URL and auth settings
  const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
  const baseUrl = isProKey ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
  const coingeckoUrl = `${baseUrl}/search/trending`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.coingecko.apiKey) {
    headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
  }

  try {
    const response = await fetch(coingeckoUrl, {
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko Error] Status ${response.status}: ${errorText}`);
      
      // Fallback to stale cache if available
      if (response.status === 429 && cached) {
        console.warn(`[Proxy Cache] Rate limited. Returning stale cache for key: ${cacheKey}`);
        return NextResponse.json(cached.data, {
          headers: {
            "x-cache-status": "STALE_FALLBACK",
            "x-warning": "Rate limited, returning stale data",
          },
        });
      }

      return NextResponse.json(
        { error: `CoinGecko API returned error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate the response data using Zod
    const validation = TrendingResponseSchema.safeParse(data);
    
    if (!validation.success) {
      console.error("[Zod Validation Error] CoinGecko trending response mismatch:", validation.error.format());
    }

    const validatedData = validation.success ? validation.data : data;

    // Cache the response
    cacheMap.set(cacheKey, {
      data: validatedData,
      timestamp: Date.now(),
    });

    return NextResponse.json(validatedData, {
      headers: {
        "x-cache-status": "MISS",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("[Proxy Exception] Failed to fetch trending from CoinGecko:", error);
    
    if (cached) {
      console.warn(`[Proxy Cache] Fetch failed. Returning stale cache for key: ${cacheKey}`);
      return NextResponse.json(cached.data, {
        headers: {
          "x-cache-status": "STALE_FALLBACK",
        },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error fetching trending data" },
      { status: 500 }
    );
  }
}
