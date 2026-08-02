"use client";

import { useState, useEffect, useRef } from "react";
import { wsManager, WSStatus } from "@/lib/websocket";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * React hook to hook into real-time price feeds via a shared WebSocket singleton manager.
 * Subscribes to the list of coinIds dynamically and cleans up subscriptions on component unmount.
 * Gracefully alerts connection drops/restores and falls back to last known rates.
 * 
 * @param coinIds List of CoinGecko coin IDs to stream (e.g. ["bitcoin", "ethereum"])
 */
export function useCoinGeckoWebSocket(coinIds: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const { addNotification } = useNotifications();
  
  // Track status transitions using a reference
  const prevStatusRef = useRef<WSStatus>("disconnected");

  // Stringify to compare array values structurally, avoiding infinite hook cycles
  const coinIdsString = JSON.stringify(coinIds);

  useEffect(() => {
    const ids = JSON.parse(coinIdsString) as string[];
    if (ids.length === 0) return;

    // Set initial status matching manager
    const initialStatus = wsManager.getStatus();
    setStatus(initialStatus);
    prevStatusRef.current = initialStatus;

    // 1. Subscribe to status events
    const unsubscribeStatus = wsManager.registerStatusListener((newStatus) => {
      setStatus(newStatus);
      if (newStatus !== prevStatusRef.current) {
        if (newStatus === "reconnecting" && prevStatusRef.current === "connected") {
          addNotification("WebSocket price feed connection lost. Reconnecting...", "warning");
        } else if (newStatus === "connected" && prevStatusRef.current === "reconnecting") {
          addNotification("WebSocket price feed connection restored.", "success");
        }
        prevStatusRef.current = newStatus;
      }
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
  }, [coinIdsString, addNotification]);

  return { prices, status };
}
export type { WSStatus };
