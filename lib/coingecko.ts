import { z } from "zod";
import { CoinMarket, TrendingResponse, CoinCategory, SimplePriceResponse, OhlcEntry } from "@/types/coingecko";

// --- Zod Response Validation Schemas (Left for other API interfaces) ---

export const CoinHistorySchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])), // [timestamp, price]
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export type CoinHistory = z.infer<typeof CoinHistorySchema>;

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
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetches trending coins from our local Next.js proxy route
 */
export async function getTrending(): Promise<TrendingResponse> {
  const response = await fetch("/api/coingecko/trending");
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetches categories list from our local Next.js proxy route
 */
export async function getCategories(): Promise<CoinCategory[]> {
  const response = await fetch("/api/coingecko/categories");
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${response.status}`);
  }
  
  return response.json();
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
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${response.status}`);
  }
  
  return response.json();
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

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${response.status}`);
  }

  return response.json();
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
