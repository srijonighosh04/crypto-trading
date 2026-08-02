import { NextResponse } from "next/server";
import { z } from "zod";

export interface CacheEntry {
  data: any;
  timestamp: number;
}

// Preserve cache across hot reloads in development
const globalCache = (globalThis as any).coingeckoGlobalCache || new Map<string, CacheEntry>();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).coingeckoGlobalCache = globalCache;
}

interface FetchWithCacheOptions<T> {
  cacheKey: string;
  ttlMs: number;
  fetchFn: () => Promise<Response>;
  schema?: z.ZodSchema<T>;
}

/**
 * Shared utility to perform caching, rate-limit fallback (HTTP 429), upstream error fallback,
 * Zod validation, and network error resilience in internal Next.js proxy routes.
 */
export async function fetchWithCache<T>({
  cacheKey,
  ttlMs,
  fetchFn,
  schema
}: FetchWithCacheOptions<T>): Promise<NextResponse> {
  const cached = globalCache.get(cacheKey);
  const now = Date.now();

  // 1. Check if cache is fresh
  if (cached && now - cached.timestamp < ttlMs) {
    console.log(`[Proxy Cache] HIT for key: ${cacheKey}`);
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        "x-cache-status": "HIT",
        "Cache-Control": `public, max-age=${Math.floor(ttlMs / 1000)}`,
      },
    });
  }

  console.log(`[Proxy Cache] MISS for key: ${cacheKey}. Fetching fresh data...`);

  try {
    const response = await fetchFn();

    // 2. Handle Rate Limit (HTTP 429)
    if (response.status === 429) {
      console.warn(`[Proxy Cache] CoinGecko rate limit reached (429) for key: ${cacheKey}`);
      if (cached) {
        console.warn(`[Proxy Cache] Returning stale cache fallback.`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: {
            "x-cache-status": "STALE_FALLBACK",
            "x-warning": "Rate limited, showing cached data",
            "Cache-Control": "no-store",
          },
        });
      }
      return NextResponse.json(
        { error: "CoinGecko API rate limit reached.", code: "RATE_LIMIT_EXCEEDED" },
        { 
          status: 429,
          headers: {
            "Retry-After": response.headers.get("retry-after") || "60",
          }
        }
      );
    }

    // 3. Handle Other Upstream Errors (e.g. 500, 404, 502)
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`[CoinGecko Error] Status ${response.status}: ${errorText}`);

      if (cached) {
        console.warn(`[Proxy Cache] Returning stale cache fallback due to upstream error ${response.status}.`);
        return NextResponse.json(cached.data, {
          status: 200,
          headers: {
            "x-cache-status": "STALE_FALLBACK",
            "x-warning": `Upstream error ${response.status}, returning stale data`,
            "Cache-Control": "no-store",
          },
        });
      }

      return NextResponse.json(
        { error: `CoinGecko API returned error: ${response.statusText || response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 4. Schema Validation (if supplied)
    let validatedData = data;
    if (schema) {
      const validation = schema.safeParse(data);
      if (!validation.success) {
        console.error(`[Zod Validation Warning] Schema mismatch for key: ${cacheKey}:`, validation.error.format());
        // Fallback to unvalidated data instead of breaking the UI, but log schema warning
      } else {
        validatedData = validation.data;
      }
    }

    // 5. Store fresh data in cache
    globalCache.set(cacheKey, {
      data: validatedData,
      timestamp: now,
    });

    return NextResponse.json(validatedData, {
      status: 200,
      headers: {
        "x-cache-status": "MISS",
        "Cache-Control": `public, max-age=${Math.floor(ttlMs / 1000)}`,
      },
    });

  } catch (error: any) {
    console.error(`[Proxy Exception] Exception fetching key: ${cacheKey}:`, error);

    // 6. Graceful Degradation for Network Exceptions
    if (cached) {
      console.warn(`[Proxy Cache] Returning stale cache fallback due to network exception.`);
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          "x-cache-status": "STALE_FALLBACK",
          "x-warning": "Network failure, returning stale data",
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal server error fetching remote data" },
      { status: 500 }
    );
  }
}
