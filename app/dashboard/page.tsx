"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopCoins } from "@/lib/coingecko";
import { useCoinGeckoWebSocket } from "@/hooks/useCoinGeckoWebSocket";
import { CoinMarket } from "@/types/coingecko";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Activity, 
  Eye, 
  Layers, 
  RefreshCw,
  AlertCircle
} from "lucide-react";

const SUPPORTED_WATCHLIST_OPTIONS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "ripple", name: "Ripple", symbol: "XRP" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
];

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState("");

  // Load watchlist from localStorage on client-side mount
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("apex_crypto_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        setWatchlist(["bitcoin", "ethereum", "solana"]);
      }
    } else {
      setWatchlist(["bitcoin", "ethereum", "solana"]);
    }
  }, []);

  // Save watchlist to localStorage on state change
  const saveWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    localStorage.setItem("apex_crypto_watchlist", JSON.stringify(newList));
  };

  // Fetch baseline statistics for all supported watchlist coins
  const { 
    data: allCoins = [], 
    isLoading: isBaseLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["dashboard-base-coins"],
    queryFn: () => getTopCoins("usd", 100),
    staleTime: 60000, // 60 seconds
  });

  // Subscribe to real-time prices for watchlisted coins
  const { prices: wsPrices } = useCoinGeckoWebSocket(watchlist);

  // Manage adding coins
  const handleAddCoin = () => {
    if (!selectedToAdd) return;
    if (watchlist.includes(selectedToAdd)) {
      setSelectedToAdd("");
      return;
    }
    const updated = [...watchlist, selectedToAdd];
    saveWatchlist(updated);
    setSelectedToAdd("");
  };

  // Manage removing coins
  const handleRemoveCoin = (coinId: string) => {
    const updated = watchlist.filter((id) => id !== coinId);
    saveWatchlist(updated);
  };

  // Price formatting helper
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(6);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(val);
  };

  // Build the list of coins to render on watchlist
  const watchlistCoins = watchlist
    .map((id) => allCoins.find((coin) => coin.id === id))
    .filter((coin): coin is CoinMarket => !!coin);

  // Filter out options that are already on the watchlist
  const addableOptions = SUPPORTED_WATCHLIST_OPTIONS.filter(
    (opt) => !watchlist.includes(opt.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Upper Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Activity className="text-primary h-8 w-8" />
            Live Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time price feeds of your selected cryptocurrency watchlist.
          </p>
        </div>

        {/* Add Coin Controls */}
        {isClient && addableOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              className="rounded-lg border border-border bg-card-light px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition"
            >
              <option value="">+ Add Asset to Live Ticker</option>
              {addableOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.symbol})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCoin}
              disabled={!selectedToAdd}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 transition"
              title="Add to watchlist"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* --- Main Contents Container --- */}
      {!isClient || isBaseLoading ? (
        <div className="text-center py-16 text-sm text-text-secondary animate-pulse space-y-4">
          <RefreshCw className="h-6 w-6 animate-spin text-accent mx-auto" />
          <p>Initialising Live Feeds...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <AlertCircle className="h-10 w-10 text-danger mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Error connecting to APIs</h3>
          <p className="text-sm text-text-secondary mt-1 mb-6">
            Failed to gather standard baseline statistics.
          </p>
          <button 
            onClick={() => refetch()} 
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : watchlistCoins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-[#090a0f]/40 p-16 text-center select-none">
          <Eye className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Your Watchlist is Empty</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
            Choose assets from the selector dropdown at the top right to start streaming live prices.
          </p>
        </div>
      ) : (
        /* Responsive Live Watchlist Cards Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {watchlistCoins.map((coin) => {
            // Determine active price stream (fall back to REST value)
            const livePrice = wsPrices[coin.id] ?? coin.current_price;
            const priceChange = coin.price_change_percentage_24h ?? 0;
            const isPositive = priceChange >= 0;

            return (
              <div 
                key={coin.id}
                className="rounded-xl border border-border bg-card p-5 shadow-lg relative group overflow-hidden transition-all duration-300 hover:border-border-hover"
              >
                {/* Background accent hover glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Coin Info Row */}
                <div className="flex items-center justify-between relative z-10">
                  <Link href={`/coin/${coin.id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coin.image} alt={coin.name} className="h-9 w-9 rounded-full" />
                    <div>
                      <h3 className="font-bold text-white leading-5 group-hover:text-primary transition-colors">
                        {coin.name}
                      </h3>
                      <span className="text-xs font-bold text-text-muted uppercase font-mono bg-[#090a0f]/40 px-1.5 py-0.5 rounded border border-border/40">
                        {coin.symbol}
                      </span>
                    </div>
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveCoin(coin.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-danger text-text-muted h-8 w-8 rounded-lg hover:bg-danger/10 flex items-center justify-center transition-all"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Pricing / Ticker Block */}
                <div className="mt-6 flex items-baseline justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-muted uppercase">Live Price</span>
                    <span className="text-2xl font-black font-mono text-white tracking-tight mt-1 transition-all duration-150">
                      ${formatPrice(livePrice)}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-bold ${
                    isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
                  }`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {priceChange.toFixed(2)}%
                  </span>
                </div>

                {/* Stats Footer Row */}
                <div className="mt-5 border-t border-border/50 pt-3 flex items-center justify-between text-xxs text-text-muted relative z-10">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>MCAP: ${formatCompact(coin.market_cap)}</span>
                  </div>
                  <span>VOL: ${formatCompact(coin.total_volume)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
