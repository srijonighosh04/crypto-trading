import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";

// --- Zod Response Validation Schema ---
const SimplePriceResponseSchema = z.record(z.string(), z.record(z.string(), z.number()));

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cacheMap = (globalThis as any).coingeckoPriceCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).coingeckoPriceCache = cacheMap;
}

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
  const cacheKey = `${sortedIds}_${sortedVs}`;

  // Check cache
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Proxy Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cached.data, {
      headers: {
        "x-cache-status": "HIT",
        "Cache-Control": "public, max-age=30",
      },
    });
  }

  console.log(`[Proxy Cache] MISS for key: ${cacheKey}. Fetching from CoinGecko...`);

  // Build CoinGecko URL and auth settings
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

  try {
    const response = await fetch(coingeckoUrl.toString(), {
      headers,
      next: { revalidate: 30 },
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
    const validation = SimplePriceResponseSchema.safeParse(data);
    if (!validation.success) {
      console.error("[Zod Validation Error] CoinGecko simple price mismatch:", validation.error.format());
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
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error: any) {
    console.error("[Proxy Exception] Failed to fetch simple price from CoinGecko:", error);
    
    if (cached) {
      console.warn(`[Proxy Cache] Fetch failed. Returning stale cache for key: ${cacheKey}`);
      return NextResponse.json(cached.data, {
        headers: {
          "x-cache-status": "STALE_FALLBACK",
        },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error fetching simple price data" },
      { status: 500 }
    );
  }
}
