"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrending, getCategories, getTopCoins } from "@/lib/coingecko";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

export default function DiscoverPage() {
  // 1. Trending Now Query
  const { 
    data: trendingData, 
    isLoading: isTrendingLoading, 
    isError: isTrendingError 
  } = useQuery({
    queryKey: ["trending"],
    queryFn: getTrending,
    staleTime: 60000, // Cache trending for 60s
  });

  // 2. Gainers & Losers Query (using Top 100 market coins)
  const { 
    data: marketsData = [], 
    isLoading: isMarketsLoading, 
    isError: isMarketsError 
  } = useQuery({
    queryKey: ["markets-discover"],
    queryFn: () => getTopCoins("usd", 100, 1),
    staleTime: 30000, // Cache markets for 30s
  });

  // 3. Categories Query
  const { 
    data: categoriesData = [], 
    isLoading: isCategoriesLoading, 
    isError: isCategoriesError 
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 60000, // Cache categories for 60s
  });

  // Client-side computation of Top Gainers & Losers from loaded markets
  const getGainersAndLosers = () => {
    if (!marketsData.length) return { gainers: [], losers: [] };
    
    // Filter coins that have price change data
    const validCoins = marketsData.filter(c => c.price_change_percentage_24h !== null && c.price_change_percentage_24h !== undefined);
    
    const sorted = [...validCoins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    
    const gainers = sorted.slice(0, 10);
    const losers = sorted.slice(-10).reverse(); // top losers
    
    return { gainers, losers };
  };

  const { gainers, losers } = getGainersAndLosers();

  // Helper formatters
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(price);
  };

  const formatMarketCap = (val: number | null) => {
    if (val === null) return "N/A";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short" }).format(val);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-accent" />
          Discover
        </h1>
        <p className="text-sm text-text-secondary mt-1">Discover trending assets, top market movers, and cryptocurrency sectors.</p>
      </div>

      {/* --- Section 1: Trending Now --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white tracking-tight">Trending Now</h2>
        </div>

        {isTrendingError && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Failed to load trending assets. Please try again later.</p>
          </div>
        )}

        {isTrendingLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 w-64 rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-border"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-16 rounded bg-border"></div>
                      <div className="h-3 w-8 rounded bg-border"></div>
                    </div>
                  </div>
                  <div className="h-4 w-6 rounded bg-border"></div>
                </div>
                <div className="h-6 w-24 rounded bg-border"></div>
                <div className="h-8 w-full rounded bg-border"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
            {trendingData?.coins?.map((coin) => {
              const item = coin.item;
              const priceChange24h = item.data.price_change_percentage_24h?.usd ?? 0;
              const isPositive = priceChange24h >= 0;

              return (
                <div 
                  key={item.id} 
                  className="flex-shrink-0 w-64 rounded-xl border border-border bg-card p-5 hover:border-border-hover hover:shadow-lg hover:shadow-black/50 transition-all duration-200 snap-start flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.large} alt={item.name} className="h-8 w-8 rounded-full bg-card-light" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-white truncate max-w-[110px]">{item.name}</span>
                        <span className="text-xs text-text-muted font-mono uppercase">{item.symbol}</span>
                      </div>
                    </div>
                    <span className="rounded-lg bg-card-light px-2 py-0.5 text-xs text-text-muted font-mono">
                      #{item.market_cap_rank || "N/A"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white font-mono leading-none">
                      {/* Price might be preformatted string (e.g. "$0.12") or number */}
                      {typeof item.data.price === "number" ? formatPrice(item.data.price) : item.data.price}
                    </span>
                    <span className={`inline-flex items-center text-xs font-bold ${isPositive ? "text-success" : "text-danger"}`}>
                      {isPositive ? "+" : ""}
                      {priceChange24h.toFixed(1)}%
                    </span>
                  </div>

                  {/* Sparkline Visual Graph */}
                  <div className="mt-4 h-10 w-full flex items-end justify-center">
                    {item.data.sparkline ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={item.data.sparkline} 
                        alt="Trend Sparkline" 
                        className={`h-full w-full object-contain filter ${
                          isPositive ? "hue-rotate-[60deg] saturate-150" : "hue-rotate-[-30deg] saturate-150"
                        }`}
                      />
                    ) : (
                      <div className="h-0.5 w-full bg-border"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Section 2: Top Gainers & Losers --- */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Gainers Table */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-5 w-5 text-success" />
              Top Gainers
            </h3>
            <p className="text-xs text-text-secondary mb-4">Highest 24h percentage gainers from the top 100 coins</p>

            {isMarketsError && (
              <div className="py-12 text-center text-sm text-text-muted">Failed to load movers data.</div>
            )}

            {isMarketsLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="h-4 w-28 bg-border rounded"></div>
                    <div className="h-4 w-12 bg-border rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/40 font-medium">
                {gainers.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />
                      <div>
                        <h4 className="text-sm font-semibold text-white leading-5">{coin.name}</h4>
                        <span className="text-xs text-text-muted font-mono uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white font-mono">{formatPrice(coin.current_price)}</p>
                      <span className="text-xs font-bold text-success font-mono">
                        +{coin.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Losers Table */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-5 w-5 text-danger" />
              Top Losers
            </h3>
            <p className="text-xs text-text-secondary mb-4">Highest 24h percentage losers from the top 100 coins</p>

            {isMarketsError && (
              <div className="py-12 text-center text-sm text-text-muted">Failed to load movers data.</div>
            )}

            {isMarketsLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="h-4 w-28 bg-border rounded"></div>
                    <div className="h-4 w-12 bg-border rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/40 font-medium">
                {losers.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />
                      <div>
                        <h4 className="text-sm font-semibold text-white leading-5">{coin.name}</h4>
                        <span className="text-xs text-text-muted font-mono uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white font-mono">{formatPrice(coin.current_price)}</p>
                      <span className="text-xs font-bold text-danger font-mono">
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- Section 3: Categories Grid --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-bold text-white tracking-tight">Market Categories</h2>
        </div>

        {isCategoriesError && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Failed to load categories. Please try again later.</p>
          </div>
        )}

        {isCategoriesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
                <div className="h-5 w-32 bg-border rounded"></div>
                <div className="h-4 w-40 bg-border rounded"></div>
                <div className="h-4 w-24 bg-border rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesData.slice(0, 15).map((category) => {
              const capChange = category.market_cap_change_24h ?? 0;
              const isPositive = capChange >= 0;

              return (
                /* 
                  Category filter routing: Navigates to /markets?category=category.id.
                  TODO: Markets page filter implementation for 'category' query parameter.
                */
                <Link
                  key={category.id}
                  href={`/markets?category=${category.id}`}
                  className="rounded-xl border border-border bg-card p-5 hover:border-border-hover hover:bg-card-light/20 transition-all duration-200 group flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-white group-hover:text-accent transition-colors truncate">
                        {category.name}
                      </h4>
                      <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {category.content || "Discover projects and assets within the " + category.name + " ecosystem."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-text-muted block">Market Cap</span>
                      <span className="font-mono text-white font-semibold">
                        {formatMarketCap(category.market_cap)}
                      </span>
                    </div>
                    {category.market_cap_change_24h !== null && (
                      <div className="text-right">
                        <span className="text-text-muted block">24h Vol Change</span>
                        <span className={`font-mono font-bold inline-flex items-center gap-0.5 ${
                          isPositive ? "text-success" : "text-danger"
                        }`}>
                          {isPositive ? "+" : ""}
                          {capChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
