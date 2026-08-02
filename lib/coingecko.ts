import { z } from "zod";
import { CoinMarket, TrendingResponse, CoinCategory, SimplePriceResponse, OhlcEntry } from "@/types/coingecko";

// --- Zod Response Validation Schemas (Left for other API interfaces) ---

export const CoinHistorySchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])), // [timestamp, price]
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export type CoinHistory = z.infer<typeof CoinHistorySchema>;

// --- Internal Helper for Centralized Response Header Checking ---

async function handleResponse(response: Response) {
  // Check headers for proxy cache warnings (e.g. Rate limits / fallback stale data)
  const cacheStatus = response.headers.get("x-cache-status");
  const warning = response.headers.get("x-warning");

  if (cacheStatus === "STALE_FALLBACK" && typeof window !== "undefined") {
    const message = warning || "Rate limit reached, returning cached offline data.";
    console.warn(`[API Client Interceptor] Proxy returned stale data alert: ${message}`);
    
    const event = new CustomEvent("coingecko-api-warning", {
      detail: { message }
    });
    window.dispatchEvent(event);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with status ${response.status}`);
  }
  
  return response.json();
}

// --- API Client Functions ---

/**
 * Fetches market data for top coins from our local Next.js proxy route
 */
export async function getTopCoins(
  vsCurrency = "usd",
  limit = 100,
  page = 1,
  order = "market_cap_desc",
  category?: string,
  ids?: string
): Promise<CoinMarket[]> {
  const queryParams = new URLSearchParams({
    vs_currency: vsCurrency,
    per_page: limit.toString(),
    page: page.toString(),
    order: order,
    price_change_percentage: "24h",
  });

  if (category) {
    queryParams.set("category", category);
  }

  if (ids) {
    queryParams.set("ids", ids);
  }

  // Fetch from our internal server API proxy route
  const response = await fetch(`/api/coingecko/markets?${queryParams.toString()}`);
  return handleResponse(response);
}

/**
 * Fetches trending coins from our local Next.js proxy route
 */
export async function getTrending(): Promise<TrendingResponse> {
  const response = await fetch("/api/coingecko/trending");
  return handleResponse(response);
}

/**
 * Fetches categories list from our local Next.js proxy route
 */
export async function getCategories(): Promise<CoinCategory[]> {
  const response = await fetch("/api/coingecko/categories");
  return handleResponse(response);
}

/**
 * Fetches simple price exchange rates for coins and vs_currencies from local proxy route
 */
export async function getSimplePrice(ids: string, vsCurrencies: string): Promise<SimplePriceResponse> {
  const queryParams = new URLSearchParams({
    ids: ids,
    vs_currencies: vsCurrencies,
  });

  const response = await fetch(`/api/coingecko/price?${queryParams.toString()}`);
  return handleResponse(response);
}

/**
 * Fetches OHLC candlestick chart data for a coin from local proxy route
 */
export async function getCoinOhlc(
  id: string,
  vsCurrency = "usd",
  days = "30"
): Promise<OhlcEntry[]> {
  const queryParams = new URLSearchParams({
    id,
    vs_currency: vsCurrency,
    days,
  });

  const response = await fetch(`/api/coingecko/ohlc?${queryParams.toString()}`);
  return handleResponse(response);
}

/**
 * Fetches historical price/market data for a given coin id (Stub)
 */
export async function getCoinHistory(
  coinId: string,
  vsCurrency = "usd",
  days = 7
): Promise<CoinHistory | null> {
  console.log(`[CoinGecko Client] Fetching historical data for ${coinId} (stub)`, { vsCurrency, days });
  return null;
}
