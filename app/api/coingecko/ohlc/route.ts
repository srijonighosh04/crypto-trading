import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";

// --- Zod Response Validation Schema ---
// CoinGecko OHLC returns an array of [timestamp, open, high, low, close]
const OhlcResponseSchema = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
);

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cacheMap = (globalThis as any).coingeckoOhlcCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).coingeckoOhlcCache = cacheMap;
}

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
  const cacheKey = `${id}_${vs_currency}_${days}`;

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
  
  const coingeckoUrl = new URL(`${baseUrl}/coins/${id}/ohlc`);
  coingeckoUrl.searchParams.set("vs_currency", vs_currency);
  coingeckoUrl.searchParams.set("days", days);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (config.coingecko.apiKey) {
    headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
  }

  try {
    const response = await fetch(coingeckoUrl.toString(), {
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko Error] Status ${response.status}: ${errorText}`);
      
      // Fallback to stale cache
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

    // Validate using Zod
    const validation = OhlcResponseSchema.safeParse(data);
    if (!validation.success) {
      console.error("[Zod Validation Error] CoinGecko OHLC response mismatch:", validation.error.format());
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
    console.error("[Proxy Exception] Failed to fetch OHLC from CoinGecko:", error);
    
    if (cached) {
      console.warn(`[Proxy Cache] Fetch failed. Returning stale cache for key: ${cacheKey}`);
      return NextResponse.json(cached.data, {
        headers: {
          "x-cache-status": "STALE_FALLBACK",
        },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error fetching OHLC data" },
      { status: 500 }
    );
  }
}
