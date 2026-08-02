"use client";

import React, { useState, use, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopCoins, getCoinOhlc } from "@/lib/coingecko";
import { useCoinGeckoWebSocket } from "@/hooks/useCoinGeckoWebSocket";
import CandlestickChart from "@/components/CandlestickChart";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Layers, 
  Calendar,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface CoinDetailPageProps {
  params: Promise<{ id: string }>;
}

function CoinDetailContent({ params }: CoinDetailPageProps) {
  // Resolve params promise in Next.js 15/16 Client Component
  const { id } = use(params);
  
  const [days, setDays] = useState("30"); // Default timeframe: 30 days
  const vsCurrency = "usd";

  // 1. Fetch basic coin info using our markets proxy with the specific ids filter
  const { 
    data: marketCoins = [], 
    isLoading: isCoinLoading, 
    isError: isCoinError,
    error: coinError
  } = useQuery({
    queryKey: ["coin-detail", id],
    queryFn: () => getTopCoins(vsCurrency, 1, 1, "market_cap_desc", undefined, id),
    staleTime: 30000, // 30s cache freshness
  });

  const coin = marketCoins?.[0]; // Get the single coin match

  // Subscribe to real-time prices for this coin ID
  const { prices: wsPrices } = useCoinGeckoWebSocket([id]);
  const livePrice = coin ? (wsPrices[id.toLowerCase()] ?? coin.current_price) : 0;

  // 2. Fetch OHLC data for the candlestick chart
  const { 
    data: ohlcData = [], 
    isLoading: isOhlcLoading, 
    isError: isOhlcError,
    error: ohlcError,
    refetch: refetchOhlc,
    isFetching: isOhlcFetching
  } = useQuery({
    queryKey: ["ohlc", id, vsCurrency, days],
    queryFn: () => getCoinOhlc(id, vsCurrency, days),
    staleTime: 60000, // 60s cache freshness
    enabled: !!id,
  });

  // Timeframe selector configurations
  const timeframes = [
    { label: "1D", value: "1" },
    { label: "7D", value: "7" },
    { label: "14D", value: "14" },
    { label: "30D", value: "30" },
    { label: "90D", value: "90" },
    { label: "1Y", value: "365" },
  ];

  // Price formatting helpers
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(price);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", compactDisplay: "short" }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  if (isCoinLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-sm text-text-secondary animate-pulse space-y-4">
        <RefreshCw className="h-6 w-6 animate-spin text-accent mx-auto" />
        <p>Loading Asset Details...</p>
      </div>
    );
  }

  if (isCoinError || !coin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Asset Not Found</h2>
        <p className="text-sm text-text-secondary mt-1 mb-6">
          {coinError instanceof Error ? coinError.message : `Could not load market data for '${id}'.`}
        </p>
        <Link href="/markets" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
          Return to Markets
        </Link>
      </div>
    );
  }

  const priceChange = coin.price_change_percentage_24h ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back button and page link */}
      <div>
        <Link 
          href="/markets" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Markets</span>
        </Link>
      </div>

      {/* --- Coin Header Row --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-border/80 pb-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coin.image} alt={coin.name} className="h-12 w-12 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{coin.name}</h1>
              <span className="text-sm font-bold text-text-muted uppercase font-mono bg-card px-2 py-0.5 rounded-md border border-border">
                {coin.symbol}
              </span>
              <span className="text-xs font-semibold text-text-muted bg-card-light px-2 py-0.5 rounded-md">
                Rank #{coin.market_cap_rank}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 leading-5">Real-time OHLC candlestick representation.</p>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="flex items-baseline md:items-end flex-col gap-1.5">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatPrice(livePrice)}
            </span>
            <span className={`inline-flex items-center gap-0.5 rounded px-2.5 py-1 text-xs font-semibold ${
              isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChange.toFixed(2)}%
            </span>
          </div>
          <span className="text-xs text-text-muted">vs USD (24h)</span>
        </div>
      </div>

      {/* --- Main Dashboard Body Grid --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main candlestick chart container (Left column spans 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Candlestick Charts
            </h3>

            {/* Timeframe Selectors */}
            <div className="flex items-center gap-1 rounded-lg bg-card p-1 border border-border">
              {timeframes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDays(t.value)}
                  disabled={isOhlcLoading || isOhlcFetching}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                    days === t.value 
                      ? "bg-primary text-white shadow" 
                      : "text-text-secondary hover:text-white hover:bg-card-light"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render candlestick chart or loading/error overlays */}
          {isOhlcError && (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <AlertCircle className="h-10 w-10 text-danger mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">OHLC Data Unreachable</h4>
              <p className="text-sm text-text-secondary mt-1 mb-6">
                {ohlcError instanceof Error ? ohlcError.message : "Error communicating with the OHLC proxy API route."}
              </p>
              <button 
                onClick={() => refetchOhlc()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Reload Chart
              </button>
            </div>
          )}

          {isOhlcLoading && (
            <div className="h-[400px] w-full rounded-xl border border-border bg-card flex flex-col items-center justify-center text-sm text-text-secondary animate-pulse">
              <RefreshCw className="h-6 w-6 animate-spin text-accent mb-2" />
              <span>Fetching Timeframe OHLC Datasets...</span>
            </div>
          )}

          {!isOhlcLoading && !isOhlcError && (
            <ErrorBoundary fallbackTitle="Chart Display Offline">
              {ohlcData.length > 0 ? (
                <CandlestickChart data={ohlcData} livePrice={livePrice} />
              ) : (
                <div className="h-[400px] w-full rounded-xl border border-border bg-card flex flex-col items-center justify-center text-sm text-text-muted">
                  <span>No candlestick data returned from CoinGecko for this timeframe.</span>
                </div>
              )}
            </ErrorBoundary>
          )}
        </div>

        {/* Coin Statistics Table Card (Right column) */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 pb-3 border-b border-border/50">
              <Layers className="h-5 w-5 text-primary" />
              Market Statistics
            </h3>
            
            <div className="divide-y divide-border/60">
              {/* 24h High */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">24h High</span>
                <span className="font-semibold text-white font-mono">
                  {coin.high_24h ? formatPrice(coin.high_24h) : "N/A"}
                </span>
              </div>

              {/* 24h Low */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">24h Low</span>
                <span className="font-semibold text-white font-mono">
                  {coin.low_24h ? formatPrice(coin.low_24h) : "N/A"}
                </span>
              </div>

              {/* Market Cap */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">Market Capitalization</span>
                <span className="font-semibold text-white font-mono">
                  {formatCompact(coin.market_cap)}
                </span>
              </div>

              {/* 24h Volume */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">24h Trading Volume</span>
                <span className="font-semibold text-white font-mono">
                  {formatCompact(coin.total_volume)}
                </span>
              </div>

              {/* Circulating Supply */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">Circulating Supply</span>
                <span className="font-semibold text-white font-mono">
                  {coin.circulating_supply ? `${formatNumber(coin.circulating_supply)} ${coin.symbol.toUpperCase()}` : "N/A"}
                </span>
              </div>

              {/* Total Supply */}
              <div className="flex justify-between py-3.5">
                <span className="text-sm text-text-secondary">Total Supply</span>
                <span className="font-semibold text-white font-mono">
                  {coin.total_supply ? `${formatNumber(coin.total_supply)} ${coin.symbol.toUpperCase()}` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-[#090A0F]/50 py-3 text-xs text-text-muted select-none">
            <Calendar className="h-4 w-4 text-accent" />
            <span>Timezone: Local System Clock</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoinDetailPage({ params }: CoinDetailPageProps) {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center text-sm text-text-secondary">
        <RefreshCw className="h-6 w-6 animate-spin text-accent mx-auto mb-2" />
        Hydrating Asset Profile...
      </div>
    }>
      <CoinDetailContent params={params} />
    </Suspense>
  );
}
