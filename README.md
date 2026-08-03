# ⚡ ApexCrypto — Professional Analytics & Trading Dashboard

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)

**ApexCrypto** is a state-of-the-art, high-performance financial dashboard engineered for cryptocurrency traders. Designed with modern aesthetics (dark glassmorphism, responsive grids, and micro-animations), it offers real-time streaming, advanced analytics, and data-resilience systems.

---

## 📸 Interface Preview & Layouts

* **Live Dashboard**: Custom watchlists displaying ticker rates, volumes, and capitalization metrics.
* **Asset Profiles**: Historical candlestick charts powered by `lightweight-charts`, integrated with real-time WebSocket tick overrides.
* **Trades Terminal**: Monospace transaction consoles streaming DEX pool transaction logs, with list-capping memory guards (200 records max) and freeze-feed controls.
* **Analytics Directory**: Sortable, search-filtered, and paginated market listings grouped by categories/sectors.

---

## 📂 Project Architecture

```bash
├── app/
│   ├── api/                     # Server-side CoinGecko proxy endpoints
│   │   └── coingecko/
│   │       ├── categories/      # Sector category queries
│   │       ├── markets/         # Market capitalization indexes
│   │       ├── ohlc/            # Historical chart data feed
│   │       ├── price/           # Exchange rates resolver
│   │       └── trending/        # Daily trending indexes
│   ├── coin/                    # [id] dynamic asset profile & charts
│   ├── converter/               # Debounced conversion calculator
│   ├── dashboard/               # Watchlist dashboard with WebSocket feeds
│   ├── discover/                # Top movers, gainers, and losers grid
│   ├── markets/                 # Paginated sortable directories
│   ├── trades/                  # DEX pool stream terminal console
│   ├── layout.tsx               # Root layouts & OpenGraph meta configs
│   ├── providers.tsx            # Providers wrapper (TanStack Query & Toasts)
│   └── globals.css              # Custom themes & Tailwind v4 variables
├── components/                  # Global widgets (Chart, ErrorBoundary, LiveIndicator)
├── context/                     # Global Notification (Toast) system
├── hooks/                       # Reusable hooks (WebSocket, Notifications)
├── lib/                         # Business utilities, Client configs & Caching
├── public/                      # Static logos and favicons
├── vercel.json                  # Security headers & redirect configs
└── package.json                 # Core dependencies
```

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (App Router, Turbopack, Server-Side layouts for SEO meta tags).
* **State & Query Management**: TanStack React Query v5 (exponential backoff retry policies, customized cache/stale lifetimes).
* **Real-time Sync**: HTML5 WebSockets (shared connections manager, status indicator, reconnection backoff).
* **Charting**: TradingView `lightweight-charts` (ResizeObservers, real-time tick integration).
* **Styling**: Tailwind CSS v4 (theme-variable extensions, fluid responsive breakpoints down to 375px).

---

## 🛡️ Data Resilience & Hardening (Phase 7)

To navigate strict API rate limits (HTTP 429) and network drops, ApexCrypto features a hardened backend cache pipeline:

* **Centralized API Proxy Caching (`lib/apiCache.ts`)**:
  - Intercepts and caches proxy routes in `globalThis` (survives dev HMR restarts).
  - Short-lived TTL (Time-to-Live) structures prevent duplicate requests.
  - Automatically serves stale cache data as a fallback when rate limits are hit or connection issues occur.
* **DOM Event Interceptor**:
  - The client API helper detects stale cache headers from the proxy and dispatches custom warnings.
  - Triggers global glassmorphic warning toasts (`"Rate limit reached, showing cached data"`).
* **Widget-Level Error Boundaries**:
  - Critical cards (Watchlists, Candlestick charts, Movers tables) are wrapped in isolated React Error Boundaries.
  - Component crashes are confined, displaying a clean "Widget Load Failed" state with a reset button, without breaking the rest of the application.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* A terminal shell (Powershell, bash, zsh)

### 1. Installation
Clone the repository and install packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the project and define your keys:

```env
# Public CoinGecko API Key (Client & Server Access)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_public_api_key_here

# Private CoinGecko API Key (Server-only Access)
COINGECKO_API_KEY=your_coingecko_server_api_key_here

# Public CoinGecko WebSocket URL (Optional: defaults to offline simulation fallback when empty)
NEXT_PUBLIC_COINGECKO_WS_URL=wss://demo-feed-coingecko.com/ws
```

> 💡 **No WebSocket API Key?**
> If `NEXT_PUBLIC_COINGECKO_WS_URL` is left empty, the application automatically boots a high-fidelity local data simulator to stream prices and trades, allowing full testing of tickers and terminal features out-of-the-box.

### 3. Launch Development Server
```bash
npm run dev -- --port 3001
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Build for Production
Run compilation and verification:
```bash
npm run build
```
Verify the output builds static routes successfully.

---

## 📝 Deployment Settings (`vercel.json`)

Vercel builds are fully optimized out-of-the-box. Custom security headers are configured in `vercel.json` to lock down browser permissions:
* **HSTS (Strict-Transport-Security)**: Forces SSL routing.
* **X-Frame-Options (SAMEORIGIN)**: Protects against Clickjacking attacks.
* **X-Content-Type-Options (nosniff)**: Prevents MIME-type sniffing.
* **Referrer-Policy (origin-when-cross-origin)**: Limits referrer leaks on outbound requests.
