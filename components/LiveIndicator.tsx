"use client";

import React, { useState, useEffect } from "react";
import { wsManager, WSStatus } from "@/lib/websocket";

/**
 * LiveIndicator component displays current WebSocket streaming status (Live / Reconnecting / Offline).
 * Uses pulsing/bouncing micro-animations to highlight active feeds.
 */
export default function LiveIndicator() {
  const [status, setStatus] = useState<WSStatus>("disconnected");

  useEffect(() => {
    // Register status change callbacks directly from the WS manager singleton
    const unsubscribe = wsManager.registerStatusListener((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const statusConfigs = {
    connected: {
      dotClass: "bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      textClass: "text-success",
      label: "Live Feed",
    },
    reconnecting: {
      dotClass: "bg-warning animate-bounce shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      textClass: "text-warning",
      label: "Reconnecting",
    },
    disconnected: {
      dotClass: "bg-text-muted/65 shadow-none",
      textClass: "text-text-muted",
      label: "Offline",
    },
  };

  const current = statusConfigs[status];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card-light/40 px-3 py-1 text-xs font-semibold select-none">
      <span className={`h-2 w-2 rounded-full transition-all duration-300 ${current.dotClass}`} />
      <span className={`font-mono transition-colors duration-300 ${current.textClass}`}>
        {current.label}
      </span>
    </div>
  );
}
