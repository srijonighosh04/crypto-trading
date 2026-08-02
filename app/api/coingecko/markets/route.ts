import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";

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

// Cache structure
interface CacheEntry {
  data: any;
  timestamp: number;
}

// Persist cache across hot-reloads in development
const cacheMap = (globalThis as any).coingeckoMarketsCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).coingeckoMarketsCache = cacheMap;
}

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
  const cacheKey = `${vs_currency}_${order}_${per_page}_${page}_${price_change_percentage}_${category || ""}_${ids || ""}`;

  // Check memory cache
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Proxy Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cached.data, {
      headers: {
        "x-cache-status": "HIT",
        "Cache-Control": "public, max-age=45",
      },
    });
  }

  console.log(`[Proxy Cache] MISS for key: ${cacheKey}. Fetching from CoinGecko...`);

  // Build CoinGecko API URL and authorization settings
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
    // Send API Key server-side for maximum security
    headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
  }

  try {
    const response = await fetch(coingeckoUrl.toString(), {
      headers,
      next: { revalidate: 45 }, // Next.js level fetch caching as fallback
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko Error] Status ${response.status}: ${errorText}`);
      
      // If we are rate-limited, try returning expired cache entry if available as grace fallback
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

    // Validate the response data schema using Zod
    const validation = CoinMarketResponseSchema.safeParse(data);
    
    if (!validation.success) {
      console.error("[Zod Validation Error] CoinGecko schema mismatch:", validation.error.format());
      // Log schema mismatch, but do not crash the app. Proceed with unvalidated payload
      // since CoinGecko fields can slightly drift.
    }

    const validatedData = validation.success ? validation.data : data;

    // Save to memory cache
    cacheMap.set(cacheKey, {
      data: validatedData,
      timestamp: Date.now(),
    });

    return NextResponse.json(validatedData, {
      headers: {
        "x-cache-status": "MISS",
        "Cache-Control": "public, max-age=45",
      },
    });
  } catch (error: any) {
    console.error("[Proxy Exception] Failed to fetch markets from CoinGecko:", error);
    
    // In case of network/fetch failure, try returning stale cache
    if (cached) {
      console.warn(`[Proxy Cache] Fetch failed. Returning stale cache for key: ${cacheKey}`);
      return NextResponse.json(cached.data, {
        headers: {
          "x-cache-status": "STALE_FALLBACK",
        },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error fetching market data" },
      { status: 500 }
    );
  }
}
