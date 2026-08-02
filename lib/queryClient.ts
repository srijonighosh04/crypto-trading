import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient instance configured with:
 * - Exponential backoff retry logic (ignoring common client 4xx issues except 429).
 * - Key-specific staleTimes to optimize fast-moving vs slow-moving datasets.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible retry rules: back off on errors unless they are non-429 client errors
      retry: (failureCount, error: any) => {
        const status = error?.status || error?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          // Client errors like 404, 401, etc. should fail immediately
          return false;
        }
        return failureCount < 3; // Retry up to 3 times on rate-limits, server drops, or timeouts
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 2s -> 4s -> 8s -> max 30s
      refetchOnWindowFocus: false,
    },
  },
});

// Configure default query configurations per data type

// 1. Very Fast Changing Data (Prices, dashboard statistics): 15 seconds staleTime
queryClient.setQueryDefaults(["dashboard-base-coins"], { staleTime: 15 * 1000 });
queryClient.setQueryDefaults(["coin-detail"], { staleTime: 15 * 1000 });

// 2. Moderately Fast Changing Data (Markets pages, OHLC graphs, calculator rates): 30 seconds staleTime
queryClient.setQueryDefaults(["coins"], { staleTime: 30 * 1000 });
queryClient.setQueryDefaults(["markets-discover"], { staleTime: 30 * 1000 });
queryClient.setQueryDefaults(["price"], { staleTime: 30 * 1000 });
queryClient.setQueryDefaults(["ohlc"], { staleTime: 30 * 1000 });

// 3. Slower Changing Data (Trending listings): 2 minutes staleTime
queryClient.setQueryDefaults(["trending"], { staleTime: 2 * 60 * 1000 });

// 4. Very Slow Changing Data (Sectors/categories descriptions): 5 minutes staleTime
queryClient.setQueryDefaults(["categories"], { staleTime: 5 * 60 * 1000 });
