"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSimplePrice } from "@/lib/coingecko";
import { 
  ArrowUpDown, 
  Calculator, 
  Clock, 
  Search, 
  ChevronDown, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface Asset {
  symbol: string;
  name: string;
  id: string; // CoinGecko API ID (fiat uses symbol)
  isCrypto: boolean;
}

const ASSET_DATABASE: Asset[] = [
  // Cryptocurrencies
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin", isCrypto: true },
  { symbol: "ETH", name: "Ethereum", id: "ethereum", isCrypto: true },
  { symbol: "SOL", name: "Solana", id: "solana", isCrypto: true },
  { symbol: "ADA", name: "Cardano", id: "cardano", isCrypto: true },
  { symbol: "XRP", name: "Ripple", id: "ripple", isCrypto: true },
  { symbol: "DOT", name: "Polkadot", id: "polkadot", isCrypto: true },
  { symbol: "DOGE", name: "Dogecoin", id: "dogecoin", isCrypto: true },
  // Fiat Currencies
  { symbol: "USD", name: "US Dollar", id: "usd", isCrypto: false },
  { symbol: "EUR", name: "Euro", id: "eur", isCrypto: false },
  { symbol: "GBP", name: "British Pound", id: "gbp", isCrypto: false },
  { symbol: "JPY", name: "Japanese Yen", id: "jpy", isCrypto: false },
  { symbol: "INR", name: "Indian Rupee", id: "inr", isCrypto: false },
];

export default function ConverterPage() {
  const [fromAsset, setFromAsset] = useState<Asset>(ASSET_DATABASE[0]); // Default: BTC
  const [toAsset, setToAsset] = useState<Asset>(ASSET_DATABASE[7]);   // Default: USD
  const [amount, setAmount] = useState<string>("1");
  const [debouncedAmount, setDebouncedAmount] = useState<string>("1");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Search dropdown states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"from" | "to" | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce the amount input value (400ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 400);
    return () => clearTimeout(handler);
  }, [amount]);

  // Determine query parameters based on asset types
  const getQueryConfig = (from: Asset, to: Asset) => {
    const fromSym = from.symbol.toLowerCase();
    const toSym = to.symbol.toLowerCase();

    if (from.isCrypto && !to.isCrypto) {
      // Crypto -> Fiat
      return {
        queryIds: from.id,
        queryVs: toSym,
        resolveRate: (data: any) => data[from.id]?.[toSym] || 0
      };
    } else if (!from.isCrypto && to.isCrypto) {
      // Fiat -> Crypto
      return {
        queryIds: to.id,
        queryVs: fromSym,
        resolveRate: (data: any) => {
          const val = data[to.id]?.[fromSym];
          return val ? 1 / val : 0;
        }
      };
    } else if (from.isCrypto && to.isCrypto) {
      // Crypto -> Crypto
      return {
        queryIds: from.id,
        queryVs: toSym,
        resolveRate: (data: any) => data[from.id]?.[toSym] || 0
      };
    } else {
      // Fiat -> Fiat (using bitcoin as standard bridge rate)
      return {
        queryIds: "bitcoin",
        queryVs: `${fromSym},${toSym}`,
        resolveRate: (data: any) => {
          const fromPrice = data.bitcoin?.[fromSym];
          const toPrice = data.bitcoin?.[toSym];
          return fromPrice && toPrice ? toPrice / fromPrice : 0;
        }
      };
    }
  };

  const { queryIds, queryVs, resolveRate } = getQueryConfig(fromAsset, toAsset);

  // Fetch price from local proxy route via React Query
  const { 
    data: priceData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["price", queryIds, queryVs],
    queryFn: () => getSimplePrice(queryIds, queryVs),
    staleTime: 30000, // Cache entries are fresh for 30s
    enabled: !!queryIds && !!queryVs,
  });

  // Update last updated timestamp on successful fetch
  useEffect(() => {
    if (priceData) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [priceData]);

  // Compute conversion result
  const rate = priceData ? resolveRate(priceData) : 0;
  const numAmount = parseFloat(debouncedAmount) || 0;
  const resultValue = numAmount * rate;

  // Handle asset swap action
  const handleSwap = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    // Recalculate result instantly with same numeric inputs
    setSearchQuery("");
  };

  // Filter asset list based on dropdown query
  const filteredAssets = ASSET_DATABASE.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format rate indicator text
  const formatRateString = () => {
    if (!rate) return "Calculating...";
    const rateFormatted = rate >= 1 ? rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : rate.toFixed(6);
    return `1 ${fromAsset.symbol} = ${rateFormatted} ${toAsset.symbol}`;
  };

  const isCalculating = isLoading || isFetching;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-primary" />
          Asset Converter
        </h1>
        <p className="text-sm text-text-secondary mt-1">Convert between major cryptocurrencies and fiat exchange rates.</p>
      </div>

      {/* Main Converter Card */}
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/40 relative">
        
        {/* Error Boundary Banner */}
        {isError && (
          <div className="mb-6 rounded-lg border border-danger/40 bg-danger/10 p-4 flex gap-3 text-sm text-danger items-start">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Error fetching price:</span>
              <p className="mt-0.5 text-xs opacity-90">
                {error instanceof Error ? error.message : "Rate limit hit or CoinGecko service unavailable."}
              </p>
            </div>
            <button 
              onClick={() => refetch()} 
              className="ml-auto rounded bg-danger/20 px-2.5 py-1 text-xs font-semibold hover:bg-danger/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Form Inputs Container */}
        <div className="space-y-4 relative" ref={dropdownRef}>
          
          {/* Row 1: FROM */}
          <div className="rounded-xl border border-border bg-[#090A0F]/60 p-4 focus-within:border-primary transition-all duration-200">
            <label className="text-xs font-semibold text-text-muted uppercase">From</label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                className="w-full bg-transparent text-xl font-bold font-mono text-white placeholder-text-muted focus:outline-none"
              />
              
              {/* Dropdown Selector FROM */}
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === "from" ? null : "from");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card-light px-3 py-1.5 text-sm font-semibold text-white hover:border-border-hover transition"
                >
                  <span>{fromAsset.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </button>

                {activeDropdown === "from" && (
                  <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-border bg-card-light p-2 shadow-xl">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search asset..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-white placeholder-text-muted focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border/20 text-xs">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.symbol}
                          onClick={() => {
                            setFromAsset(asset);
                            setActiveDropdown(null);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md transition ${
                            fromAsset.symbol === asset.symbol 
                              ? "bg-primary text-white" 
                              : "text-text-secondary hover:bg-card hover:text-white"
                          }`}
                        >
                          <span className="font-bold">{asset.symbol}</span> - {asset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SWAP BUTTON (Overlay middle) */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwap}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card-light hover:bg-[#1f2336] text-accent hover:text-white active:scale-95 shadow-md hover:border-border-hover transition-all duration-200"
              title="Swap currencies"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: TO */}
          <div className="rounded-xl border border-border bg-[#090A0F]/60 p-4">
            <label className="text-xs font-semibold text-text-muted uppercase">To</label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-full text-xl font-bold font-mono text-white/90 select-none">
                {isCalculating ? (
                  <span className="inline-flex gap-1 items-center">
                    <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-sm text-text-muted">Calculating...</span>
                  </span>
                ) : (
                  resultValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                )}
              </div>

              {/* Dropdown Selector TO */}
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === "to" ? null : "to");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card-light px-3 py-1.5 text-sm font-semibold text-white hover:border-border-hover transition"
                >
                  <span>{toAsset.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </button>

                {activeDropdown === "to" && (
                  <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-border bg-card-light p-2 shadow-xl">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search asset..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-white placeholder-text-muted focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border/20 text-xs">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset.symbol}
                          onClick={() => {
                            setToAsset(asset);
                            setActiveDropdown(null);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md transition ${
                            toAsset.symbol === asset.symbol 
                              ? "bg-primary text-white" 
                              : "text-text-secondary hover:bg-card hover:text-white"
                          }`}
                        >
                          <span className="font-bold">{asset.symbol}</span> - {asset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Info & Updated Indicators */}
        <div className="mt-6 border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-text-secondary font-mono">{formatRateString()}</span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>Rates updated at {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
