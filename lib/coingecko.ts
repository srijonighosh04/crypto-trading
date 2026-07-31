import { config } from "./config";
import { z } from "zod";

// CoinGecko API URL endpoints
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_PRO_BASE_URL = "https://pro-api.coingecko.com/api/v3";

// --- Zod Response Validation Schemas ---

export const CoinMarketDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number(),
  price_change_percentage_24h: z.number().nullable(),
  total_volume: z.number(),
  high_24h: z.number().nullable().optional(),
  low_24h: z.number().nullable().optional(),
});

export const CoinHistorySchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])), // [timestamp, price]
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

export type CoinMarketData = z.infer<typeof CoinMarketDataSchema>;
export type CoinHistory = z.infer<typeof CoinHistorySchema>;

// --- API Helper functions ---

/**
 * Returns configuration settings for CoinGecko requests based on the API Key
 */
function getApiConfig() {
  // Demo keys start with 'CG-', Pro keys don't
  const isProKey = config.coingecko.apiKey && !config.coingecko.apiKey.startsWith("CG-");
  const baseUrl = isProKey ? COINGECKO_PRO_BASE_URL : COINGECKO_BASE_URL;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const params: Record<string, string> = {};

  if (config.coingecko.apiKey) {
    if (config.coingecko.isServerKey) {
      // Header authorization (for server-side requests)
      headers[isProKey ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.coingecko.apiKey;
    } else {
      // Parameter authorization (for client-side requests)
      params[isProKey ? "x_cg_pro_api_key" : "x_cg_demo_api_key"] = config.coingecko.apiKey;
    }
  }

  return { baseUrl, headers, params };
}

// --- Stub API Client Functions ---

/**
 * Fetches market data for top coins sorted by market cap
 */
export async function getTopCoins(
  vsCurrency = "usd",
  limit = 20,
  page = 1
): Promise<CoinMarketData[]> {
  const { baseUrl, headers, params } = getApiConfig();
  console.log(`[CoinGecko Client] Fetching top coins from ${baseUrl} (stub)`, { vsCurrency, limit, page, headers, params });
  
  // TODO: Replace with actual fetch & Zod parsing
  // const response = await fetch(`${baseUrl}/coins/markets?...`);
  // const data = await response.json();
  // return z.array(CoinMarketDataSchema).parse(data);
  return [];
}

/**
 * Fetches historical price/market data for a given coin id
 */
export async function getCoinHistory(
  coinId: string,
  vsCurrency = "usd",
  days = 7
): Promise<CoinHistory | null> {
  const { baseUrl, headers, params } = getApiConfig();
  console.log(`[CoinGecko Client] Fetching historical data for ${coinId} (stub)`, { vsCurrency, days, baseUrl, headers, params });
  
  // TODO: Replace with actual fetch & Zod parsing
  // const response = await fetch(`${baseUrl}/coins/${coinId}/market_chart?...`);
  // const data = await response.json();
  // return CoinHistorySchema.parse(data);
  return null;
}
