# ApexCrypto — Professional Analytics & Trading Dashboard

ApexCrypto is a high-performance, real-time cryptocurrency dashboard built on Next.js, TanStack React Query, and TailwindCSS. It integrates live WebSocket price tickers, dynamic candlestick charts, currency calculators, and scrollable transaction trade feeds, built on top of a highly resilient, rate-limit hardened data pipeline.

---

## Key Features

1. **Live Dashboard (`/dashboard`)**
   - Stream real-time price tickers of your favorite cryptocurrencies in a custom live watchlist.
   - Interactive UI to add or remove assets dynamically. Cached locally in `localStorage`.

2. **Movers & Markets (`/markets`)**
   - High-density directory displaying coin ranks, current prices, 24h changes, market capitalizations, and trading volumes.
   - Interactive column sorting, pagination, search filters, and sector/category tags filtering.

3. **Crypto Converter (`/converter`)**
   - Instantly convert values between major cryptocurrencies (BTC, ETH, SOL, XRP, ADA, DOT, DOGE) and fiat currencies (USD, EUR, GBP, JPY, INR) using the real-time rate calculator.
   - Includes input change debouncing (400ms) to throttle API calls and prevent rate limiting.

4. **Trades Feed (`/trades`)**
   - Monospace transaction terminal layout displaying live DEX pool swaps: swap time, side (BUY/SELL), token prices, volume amounts, and total values.
   - Capped at **200 items** in the DOM to ensure stable browser memory consumption.
   - Pause feed controls to freeze scrolling lines, resume feed catching up instantly, and clear feed options.

5. **Discover Projects (`/discover`)**
   - Showcase of trending project lists, top 24h gainers/losers, and sector categories (DeFi, Layer 1s, Memes, etc.).

6. **Asset Profile (`/coin/[id]`)**
   - Real-time profile details including ranks, high/low limits, market cap, and supply metrics.
   - Candlestick chart tracking asset price movements using the `lightweight-charts` library.
   - Timeframe selector buttons (1D, 7D, 14D, 30D, 90D, 1Y) fetching corresponding historical datasets.
   - Price feeds override the last candle in real-time as WebSocket ticks arrive.

---

## Data Resilience Architecture (Phase 7 Hardening)

To guarantee 100% uptime and graceful degradation under strict rate limits:
- **Centralized Proxy Caching (`lib/apiCache.ts`)**: All CoinGecko API routes are piped through a shared cache manager. Features automatic TTLs and returns "stale fallback" data if upstream feeds are unreachable or rate-limited.
- **Rate-Limit Interceptor**: When proxy API routes hit HTTP 429 limits, the client REST helper catches it and triggers a warning toast alert (`"Rate limit reached, showing cached data"`).
- **Error Boundaries**: Key dashboard sections (watchlist grids, movers cards, chart widgets) are wrapped in custom React error boundaries. A rendering crash in one section isolates the error and allows reloading it without crashing the entire page.
- **React Query Default Tuning**: Global retry strategies utilize exponential backoffs (ignoring client errors while retrying rate limits and network drops) and query-specific stale times (15s for pricing, 5m for categories).

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm.

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory. Copy variables from `.env.local.example`:

```env
# Public CoinGecko API Key (Client & Server Access)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_public_api_key_here

# Private CoinGecko API Key (Server-only Access)
COINGECKO_API_KEY=your_coingecko_server_api_key_here

# Public CoinGecko WebSocket URL (Optional: defaults to offline simulation fallback when empty)
NEXT_PUBLIC_COINGECKO_WS_URL=wss://demo-feed-coingecko.com/ws
```

*Note: Since real CoinGecko WebSocket connections require premium API access, the application automatically runs a high-fidelity local simulator for prices and pool trades if `NEXT_PUBLIC_COINGECKO_WS_URL` is omitted, allowing out-of-the-box local testing.*

### 3. Run the development server
```bash
npm run dev -- --port 3001
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Build for Production
```bash
npm run build
```
Verify compilation is clean and all pages are successfully built.
