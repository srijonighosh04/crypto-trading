"use client";

import React, { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { getTopCoins } from "@/lib/coingecko";
import { CoinMarket } from "@/types/coingecko";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw, 
  AlertCircle,
  X
} from "lucide-react";

type SortField = "rank" | "price" | "change" | "market_cap" | "volume";
type SortOrder = "asc" | "desc";

function MarketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const limit = 100; // Load 100 items per page

  // Fetch coins using React Query (including category in key and fetch args)
  const { data: coins = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["coins", page, category],
    queryFn: () => getTopCoins("usd", limit, page, "market_cap_desc", category),
    staleTime: 30000, // 30 seconds cache stale time
    placeholderData: (previousData) => previousData, // keep previous data while fetching new page
  });

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for new fields
    }
  };

  // Format currency helpers
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(price);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short" }).format(val);
  };

  // Helper to format Category Slug into user readable format
  const getCategoryName = (cat: string) => {
    return cat
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filter loaded coins client-side based on search term
  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Sort filtered coins client-side
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    let aVal: number = 0;
    let bVal: number = 0;

    switch (sortBy) {
      case "rank":
        aVal = a.market_cap_rank;
        bVal = b.market_cap_rank;
        break;
      case "price":
        aVal = a.current_price;
        bVal = b.current_price;
        break;
      case "change":
        aVal = a.price_change_percentage_24h ?? 0;
        bVal = b.price_change_percentage_24h ?? 0;
        break;
      case "market_cap":
        aVal = a.market_cap;
        bVal = b.market_cap;
        break;
      case "volume":
        aVal = a.total_volume;
        bVal = b.total_volume;
        break;
    }

    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Sort Indicator Icon helper
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 group-hover:opacity-75 transition-opacity" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5 text-accent" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5 text-accent" />
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Cryptocurrency Markets</h1>
          <p className="text-sm text-text-secondary mt-1">
            {category 
              ? `Displaying sector: ${getCategoryName(category)}`
              : "Live market capitalization, volumes, and 24h price trends."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Category Filter Badge */}
          {category && (
            <Link
              href="/markets"
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-primary/20 transition-all"
            >
              <span>Sector: {getCategoryName(category)}</span>
              <X className="h-3 w-3 text-text-muted hover:text-white" />
            </Link>
          )}

          {/* Search Box */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-white placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 sm:w-64"
            />
          </div>

          {/* Refetch Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-card-light text-text-secondary hover:text-white transition-all disabled:opacity-50"
            title="Refresh market data"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isFetching ? "animate-spin text-accent" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Table Content Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <AlertCircle className="h-12 w-12 text-danger mb-4" />
            <h3 className="text-lg font-bold text-white">Failed to Load Markets</h3>
            <p className="text-sm text-text-secondary max-w-md mt-1 mb-6">
              {error instanceof Error ? error.message : "We encountered an issue communicating with the proxy route."}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !coins.length && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm text-text-secondary">
              <thead className="border-b border-border bg-[#0b0d16] text-xs font-semibold uppercase text-text-muted">
                <tr>
                  <th className="py-4 px-4 w-12">#</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6 text-right">Price</th>
                  <th className="py-4 px-6 text-right">24h Change</th>
                  <th className="py-4 px-6 text-right">Market Cap</th>
                  <th className="py-4 px-6 text-right">24h Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-4 rounded bg-border"></div></td>
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-border"></div>
                      <div className="flex flex-col gap-1.5">
                        <div className="h-4 w-24 rounded bg-border"></div>
                        <div className="h-3 w-10 rounded bg-border"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-4 w-16 rounded bg-border ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 rounded bg-border ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 rounded bg-border ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 rounded bg-border ml-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table View */}
        {!isLoading && !isError && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm text-text-secondary">
              <thead className="border-b border-border bg-[#0b0d16] text-xs font-semibold uppercase text-text-muted select-none">
                <tr>
                  <th 
                    onClick={() => handleSort("rank")}
                    className="py-4 px-4 w-16 cursor-pointer hover:bg-card-light transition-all group"
                  >
                    <span className="flex items-center">
                      # <SortIndicator field="rank" />
                    </span>
                  </th>
                  <th className="py-4 px-6">Name</th>
                  <th 
                    onClick={() => handleSort("price")}
                    className="py-4 px-6 text-right cursor-pointer hover:bg-card-light transition-all group"
                  >
                    <span className="flex items-center justify-end">
                      Price <SortIndicator field="price" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("change")}
                    className="py-4 px-6 text-right cursor-pointer hover:bg-card-light transition-all group"
                  >
                    <span className="flex items-center justify-end">
                      24h Change <SortIndicator field="change" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("market_cap")}
                    className="py-4 px-6 text-right cursor-pointer hover:bg-card-light transition-all group"
                  >
                    <span className="flex items-center justify-end">
                      Market Cap <SortIndicator field="market_cap" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("volume")}
                    className="py-4 px-6 text-right cursor-pointer hover:bg-card-light transition-all group"
                  >
                    <span className="flex items-center justify-end">
                      24h Volume <SortIndicator field="volume" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {sortedCoins.length > 0 ? (
                  sortedCoins.map((coin) => {
                    const priceChange = coin.price_change_percentage_24h ?? 0;
                    const isPositive = priceChange >= 0;

                    return (
                      <tr 
                        key={coin.id} 
                        onClick={() => router.push(`/coin/${coin.id}`)}
                        className="hover:bg-[#151926]/40 cursor-pointer transition-all duration-150"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                          {coin.market_cap_rank}
                        </td>
                        {/* Asset info */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={coin.image} 
                              alt={coin.name} 
                              className="h-6 w-6 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://placehold.co/24x24/1F2235/white?text=${coin.symbol.substring(0, 2).toUpperCase()}`;
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold text-white leading-5">{coin.name}</span>
                              <span className="text-xs text-text-muted font-mono uppercase">{coin.symbol}</span>
                            </div>
                          </div>
                        </td>
                        {/* Current Price */}
                        <td className="py-3.5 px-6 text-right font-mono text-white text-sm">
                          {formatPrice(coin.current_price)}
                        </td>
                        {/* Percentage change */}
                        <td className={`py-3.5 px-6 text-right font-mono text-sm`}>
                          <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-semibold ${
                            isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
                          }`}>
                            {isPositive ? "+" : ""}
                            {priceChange.toFixed(2)}%
                          </span>
                        </td>
                        {/* Market Cap */}
                        <td className="py-3.5 px-6 text-right font-mono text-white text-sm">
                          {formatCompact(coin.market_cap)}
                        </td>
                        {/* Volume */}
                        <td className="py-3.5 px-6 text-right font-mono text-white text-sm">
                          {formatCompact(coin.total_volume)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-sm text-text-muted">
                      No matching coins found for &quot;{search}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {!isError && !isLoading && (
          <div className="flex items-center justify-between border-t border-border/80 bg-[#0b0d16] px-4 py-4 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || isFetching}
                className="relative inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-white hover:bg-card-light disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={coins.length < limit || isFetching}
                className="relative ml-3 inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-white hover:bg-card-light disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-text-muted">
                  Showing page <span className="font-semibold text-white">{page}</span> of top market capitalized assets.
                </p>
              </div>
              <div>
                <nav className="inline-flex gap-2 rounded-lg shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1 || isFetching}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-text-secondary hover:text-white hover:bg-card-light disabled:opacity-50 transition-all"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <div className="inline-flex h-9 items-center justify-center rounded-lg border border-border/50 bg-[#121420]/30 px-4 text-xs font-semibold text-white select-none">
                    Page {page}
                  </div>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={coins.length < limit || isFetching}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-text-secondary hover:text-white hover:bg-card-light disabled:opacity-50 transition-all"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-sm text-text-secondary">
        <RefreshCw className="h-6 w-6 animate-spin text-accent mx-auto mb-2" />
        Loading Markets Section...
      </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}
