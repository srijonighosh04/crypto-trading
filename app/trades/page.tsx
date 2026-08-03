"use client";

import React, { useState, useEffect, useRef } from "react";
import LiveIndicator from "@/components/LiveIndicator";
import { Trade } from "@/lib/websocket";
import { 
  ArrowLeftRight, 
  Search, 
  ChevronDown, 
  Pause, 
  Play, 
  Trash2, 
  HelpCircle,
  Database
} from "lucide-react";

interface TradingPair {
  id: string;
  name: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

const SUPPORTED_PAIRS: TradingPair[] = [
  { id: "bitcoin/usd", name: "BTC / USD", symbol: "BTC/USD", baseAsset: "bitcoin", quoteAsset: "usd" },
  { id: "ethereum/usd", name: "ETH / USD", symbol: "ETH/USD", baseAsset: "ethereum", quoteAsset: "usd" },
  { id: "solana/usd", name: "SOL / USD", symbol: "SOL/USD", baseAsset: "solana", quoteAsset: "usd" },
  { id: "cardano/usd", name: "ADA / USD", symbol: "ADA/USD", baseAsset: "cardano", quoteAsset: "usd" },
  { id: "ripple/usd", name: "XRP / USD", symbol: "XRP/USD", baseAsset: "ripple", quoteAsset: "usd" },
  { id: "polkadot/usd", name: "DOT / USD", symbol: "DOT/USD", baseAsset: "polkadot", quoteAsset: "usd" },
  { id: "dogecoin/usd", name: "DOGE / USD", symbol: "DOGE/USD", baseAsset: "dogecoin", quoteAsset: "usd" },
];

import { wsManager, WSStatus } from "@/lib/websocket";
import { useNotifications } from "@/hooks/useNotifications";

export default function TradesPage() {
  const [selectedPair, setSelectedPair] = useState<TradingPair>(SUPPORTED_PAIRS[0]); // Default BTC/USD
  const [isPaused, setIsPaused] = useState(false);
  const [displayTrades, setDisplayTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { addNotification } = useNotifications();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<Trade[]>([]);
  const isPausedRef = useRef(isPaused);
  const prevStatusRef = useRef<WSStatus>("disconnected");

  // Sync isPaused state to ref and handle catch-up
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused) {
      setDisplayTrades(tradesRef.current);
    }
  }, [isPaused]);

  // Subscribe to live on-chain trades feed
  useEffect(() => {
    const cleanId = selectedPair.id.toLowerCase();
    
    // Reset buffer and state on pair change
    tradesRef.current = [];
    setDisplayTrades([]);

    // Initialize status mapping manager state
    const initialStatus = wsManager.getStatus();
    setStatus(initialStatus);
    prevStatusRef.current = initialStatus;

    // 1. Subscribe to status events
    const unsubscribeStatus = wsManager.registerStatusListener((newStatus) => {
      setStatus(newStatus);
      if (newStatus !== prevStatusRef.current) {
        if (newStatus === "reconnecting" && prevStatusRef.current === "connected") {
          addNotification("WebSocket trades feed connection lost. Reconnecting...", "warning");
        } else if (newStatus === "connected" && prevStatusRef.current === "reconnecting") {
          addNotification("WebSocket trades feed connection restored.", "success");
        }
        prevStatusRef.current = newStatus;
      }
    });

    // 2. Register trades callback
    const callback = (tradesBatch: Trade[]) => {
      tradesRef.current = [...tradesBatch, ...tradesRef.current].slice(0, 200);
      if (!isPausedRef.current) {
        setDisplayTrades(tradesRef.current);
      }
    };

    wsManager.subscribeTrades(cleanId, callback);

    // 3. Cleanup on unmount/pair change
    return () => {
      unsubscribeStatus();
      wsManager.unsubscribeTrades(cleanId, callback);
    };
  }, [selectedPair.id, addNotification]);

  // Handle clicking outside searchable select
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format price output based on price scale
  const formatPrice = (price: number) => {
    if (price >= 100) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }
    return price.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100) {
      return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const formatTotal = (total: number) => {
    if (total >= 100) {
      return total.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return total.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const handlePairChange = (pair: TradingPair) => {
    setSelectedPair(pair);
    setDropdownOpen(false);
    setSearchQuery("");
    tradesRef.current = [];
    setDisplayTrades([]);
    setIsPaused(false); // Reset pause state when switching pair
  };

  // Filter pair dropdown items
  const filteredPairs = SUPPORTED_PAIRS.filter((pair) =>
    pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="text-primary h-8 w-8" />
            Live Trade Feed
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time on-chain transaction stream from major DEX pools.
          </p>
        </div>

        {/* Live status indicators */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <LiveIndicator />
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Database className="h-3.5 w-3.5 text-accent" />
            <span>DEX Router Feed</span>
          </div>
        </div>
      </div>

      {/* Control Actions & Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-md">
        
        {/* Searchable Pair Selector Dropdown */}
        <div className="relative w-full sm:w-64" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full rounded-lg border border-border bg-card-light px-4 py-2.5 text-sm font-semibold text-white hover:border-border-hover transition"
          >
            <span>DEX Pool: {selectedPair.symbol}</span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-full z-50 rounded-xl border border-border bg-card-light p-2 shadow-xl">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search pair..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-white placeholder-text-muted focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-border/20 text-xs">
                {filteredPairs.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => handlePairChange(pair)}
                    className={`w-full text-left px-3 py-2 rounded-md transition ${
                      selectedPair.id === pair.id 
                        ? "bg-primary text-white" 
                        : "text-text-secondary hover:bg-card hover:text-white"
                    }`}
                  >
                    <span className="font-bold">{pair.symbol}</span> - {pair.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border transition-all duration-200 ${
              isPaused 
                ? "bg-success/15 border-success/40 text-success hover:bg-success/25"
                : "bg-warning/15 border-warning/40 text-warning hover:bg-warning/25"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                <span>Resume Feed</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause Feed</span>
              </>
            )}
          </button>

          {/* Clear Feed Button */}
          <button
            onClick={() => {
              tradesRef.current = [];
              setDisplayTrades([]);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-[#181a26]/40 hover:bg-[#1f2336] px-4 py-2 text-sm font-semibold text-text-secondary hover:text-white transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Feed</span>
          </button>
        </div>
      </div>

      {/* --- Terminal-like Trades Feed Table --- */}
      <div className="rounded-xl border border-border bg-[#090A0F]/85 overflow-hidden shadow-2xl relative">
        
        {/* Terminal Header */}
        <div className="bg-[#121420] border-b border-border/80 px-4 py-2.5 flex items-center justify-between text-xxs text-text-muted select-none font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-success/70"></span>
            <span className="ml-2">trades_console_v2.sh</span>
          </div>
          <span>BUFFER RATE: 350ms</span>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full min-w-[600px] text-left border-collapse font-mono text-xs select-none table-fixed">
            <thead className="sticky top-0 bg-[#0c0d15] text-[#4f5b75] border-b border-border/40 select-none z-10">
              <tr>
                <th className="py-2.5 px-4 w-1/5 font-semibold">TIME</th>
                <th className="py-2.5 px-4 w-1/6 font-semibold">SIDE</th>
                <th className="py-2.5 px-4 text-right w-1/5 font-semibold">PRICE (USD)</th>
                <th className="py-2.5 px-4 text-right w-1/5 font-semibold">AMOUNT ({selectedPair.symbol.split('/')[0]})</th>
                <th className="py-2.5 px-4 text-right w-1/4 font-semibold">TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {displayTrades.length > 0 ? (
                displayTrades.map((trade) => {
                  const isBuy = trade.side === "buy";

                  return (
                    <tr 
                      key={trade.id}
                      className={`hover:bg-[#121420]/30 transition-all duration-150 animate-fade-in ${
                        isBuy 
                          ? "bg-success/[0.02] text-success hover:bg-success/[0.06]" 
                          : "bg-danger/[0.02] text-danger hover:bg-danger/[0.06]"
                      }`}
                    >
                      {/* Time */}
                      <td className="py-2 px-4 text-text-muted font-light">
                        {trade.time}
                      </td>

                      {/* Side */}
                      <td className="py-2 px-4">
                        <span className={`inline-block font-black uppercase text-[10px] tracking-wider rounded px-1.5 py-0.5 leading-none ${
                          isBuy ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                        }`}>
                          {trade.side}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-2 px-4 text-right font-semibold">
                        ${formatPrice(trade.price)}
                      </td>

                      {/* Amount */}
                      <td className="py-2 px-4 text-right">
                        {formatAmount(trade.amount)}
                      </td>

                      {/* Total */}
                      <td className="py-2 px-4 text-right font-semibold">
                        {formatTotal(trade.total)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-text-muted">
                      <HelpCircle className="h-8 w-8 opacity-60 animate-pulse text-accent" />
                      <div>
                        <p className="font-bold text-white/90">Waiting for pool transactions...</p>
                        <p className="text-[11px] opacity-75 mt-0.5">Live trades will appear automatically here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
