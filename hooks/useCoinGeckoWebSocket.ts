import { useState, useEffect } from "react";
import { wsManager, WSStatus } from "@/lib/websocket";

/**
 * React hook to hook into real-time price feeds via a shared WebSocket singleton manager.
 * Subscribes to the list of coinIds dynamically and cleans up subscriptions on component unmount.
 * 
 * @param coinIds List of CoinGecko coin IDs to stream (e.g. ["bitcoin", "ethereum"])
 */
export function useCoinGeckoWebSocket(coinIds: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<WSStatus>("disconnected");

  // Stringify to compare array values structurally, avoiding infinite hook cycles
  const coinIdsString = JSON.stringify(coinIds);

  useEffect(() => {
    const ids = JSON.parse(coinIdsString) as string[];
    if (ids.length === 0) return;

    // 1. Subscribe to status events
    const unsubscribeStatus = wsManager.registerStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    // 2. Create update callback references
    const subscriptions: Array<{ id: string; callback: (price: number) => void }> = [];

    ids.forEach((id) => {
      const cleanId = id.toLowerCase();
      
      const callback = (price: number) => {
        setPrices((prev) => ({
          ...prev,
          [cleanId]: price,
        }));
      };

      subscriptions.push({ id: cleanId, callback });
      wsManager.subscribe(cleanId, callback);
    });

    // 3. Cleanup on unmount or dependency array change
    return () => {
      unsubscribeStatus();
      subscriptions.forEach((sub) => {
        wsManager.unsubscribe(sub.id, sub.callback);
      });
    };
  }, [coinIdsString]);

  return { prices, status };
}
export type { WSStatus };
