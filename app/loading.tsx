import React from "react";
import { RefreshCw, Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center select-none">
      {/* Brand logo container */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent p-3 text-white shadow-xl shadow-primary/20 animate-pulse relative">
        <Activity className="h-8 w-8" />
        {/* Ring animations */}
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-ping pointer-events-none" />
      </div>

      {/* Loading description */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <RefreshCw className="h-4.5 w-4.5 animate-spin text-accent" />
          Synchronising Feeds
        </h3>
        <p className="text-sm text-text-secondary max-w-xs mx-auto">
          ApexCrypto is preparing real-time pricing grids and market statistics...
        </p>
      </div>
    </div>
  );
}
