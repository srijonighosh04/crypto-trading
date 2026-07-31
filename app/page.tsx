import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  BarChart3, 
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Home() {
  // Mock data for the dashboard skeleton
  const stats = [
    { name: "Total Market Cap", value: "$2.48T", change: "+3.2%", isUp: true, icon: Layers },
    { name: "24h Volume", value: "$84.5B", change: "+12.4%", isUp: true, icon: DollarSign },
    { name: "BTC Dominance", value: "54.2%", change: "-0.5%", isUp: false, icon: Percent },
    { name: "Apex Sentiment", value: "Greed", change: "72/100", isUp: true, icon: Sparkles },
  ];

  const mockCoins = [
    { rank: 1, name: "Bitcoin", symbol: "BTC", price: "$64,248.50", change24h: "+2.8%", isUp: true, cap: "$1.26T" },
    { rank: 2, name: "Ethereum", symbol: "ETH", price: "$3,450.25", change24h: "+4.1%", isUp: true, cap: "$414.8B" },
    { rank: 3, name: "Solana", symbol: "SOL", price: "$142.80", change24h: "-1.5%", isUp: false, cap: "$66.2B" },
    { rank: 4, name: "Cardano", symbol: "ADA", price: "$0.48", change24h: "+0.2%", isUp: true, cap: "$17.1B" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[#151829] to-[#0d0f1a] p-6 sm:p-8 mb-8">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-accent/15 blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Introducing Real-Time Analytics
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Track and Analyze the Crypto Market
          </h1>
          <p className="mt-2 text-base text-text-secondary leading-relaxed">
            ApexCrypto provides instant insights, advanced charting, and market data powered by Zod validations and React Query caching.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#090A0F] shadow-lg shadow-accent/20 hover:opacity-90 active:scale-[0.98] transition-all">
              <span>Explore Markets</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-card-light transition-all">
              <span>View API Docs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="rounded-xl border border-border bg-card p-5 hover:border-border-hover hover:shadow-lg hover:shadow-black/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">{stat.name}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-light text-accent">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  stat.isUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  {stat.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Dashboard layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Chart Skeleton (Left & Mid column) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Market Performance
                </h3>
                <p className="text-xs text-text-secondary">BTC/USDT 24h interactive price chart skeleton</p>
              </div>
              {/* Tab Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-card-light p-1">
                {["1H", "24H", "1W", "1M", "1Y"].map((t) => (
                  <button 
                    key={t}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                      t === "24H" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart Graphic Area */}
          <div className="my-6 flex-1 flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-[#090A0F]/50 min-h-[220px] relative overflow-hidden group">
            {/* Ambient Background Glow inside chart */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-50"></div>
            
            {/* Simulated Chart Line */}
            <svg className="absolute inset-0 w-full h-full p-2 text-primary/30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path 
                d="M0,80 Q10,70 20,75 T40,50 T60,55 T80,30 T100,20" 
                fill="none" 
                stroke="url(#chart-gradient)" 
                strokeWidth="2.5" 
                className="drop-shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
              />
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>

            <div className="relative z-10 flex flex-col items-center gap-2 p-4 text-center">
              <span className="rounded-lg bg-card-light border border-border px-3 py-1.5 text-xs text-text-secondary font-mono">
                lightweight-charts Ready
              </span>
              <p className="text-xs text-text-muted">
                Chart container configured. Integration API hook setup pending.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-border/50 pt-4 text-text-muted">
            <span>Last updated: Just now</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
              Live Websocket Feed Enabled
            </span>
          </div>
        </div>

        {/* Top Assets (Right column) */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Market Overview</h3>
            <p className="text-xs text-text-secondary mb-4">Top cryptocurrency assets sorted by market cap</p>
            
            <div className="divide-y divide-border/60">
              {mockCoins.map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card-light font-bold text-sm text-text-primary border border-border">
                      {coin.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-5">{coin.name}</h4>
                      <span className="text-xs text-text-muted font-mono">{coin.symbol}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white font-mono">{coin.price}</p>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold font-mono ${
                      coin.isUp ? "text-success" : "text-danger"
                    }`}>
                      {coin.change24h}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full mt-6 rounded-lg border border-border bg-card-light py-2 text-sm font-semibold text-white hover:bg-[#1f2336] transition-all">
            View All Assets
          </button>
        </div>
      </div>
    </div>
  );
}
