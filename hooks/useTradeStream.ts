import { useState, useEffect } from "react";
import { wsManager, WSStatus, Trade } from "@/lib/websocket";

/**
 * Custom React hook to stream live on-chain trades for a coin pair (e.g. "bitcoin/usd").
 * Automatically registers subscription callbacks with the WS manager singleton
 * and handles cleanups on component unmount.
 * 
 * @param pairId The CoinGecko pair ID to subscribe to (e.g. "bitcoin/usd")
 */
export function useTradeStream(pairId: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<WSStatus>("disconnected");

  const cleanPairId = pairId.toLowerCase();

  useEffect(() => {
    if (!cleanPairId) return;

    // Reset trades array on pair change
    setTrades([]);

    // 1. Subscribe to WS connection status
    const unsubscribeStatus = wsManager.registerStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    // 2. Register trade events callback
    const callback = (tradesBatch: Trade[]) => {
      setTrades((prev) => {
        // Prepend new trades to the top of the feed and cap at 200 entries
        const combined = [...tradesBatch, ...prev];
        return combined.slice(0, 200);
      });
    };

    wsManager.subscribeTrades(cleanPairId, callback);

    // 3. Unregister listeners on unmount
    return () => {
      unsubscribeStatus();
      wsManager.unsubscribeTrades(cleanPairId, callback);
    };
  }, [cleanPairId]);

  const clearTrades = () => setTrades([]);

  return { trades, status, clearTrades };
}
