export type WSStatus = "connected" | "reconnecting" | "disconnected";

export interface Trade {
  id: string;
  time: string; // "HH:MM:SS" format
  side: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
}

interface CacheEntry {
  price: number;
  timestamp: number;
}

class CoinGeckoWSManager {
  private socket: WebSocket | null = null;
  private status: WSStatus = "disconnected";
  private statusListeners = new Set<(status: WSStatus) => void>();
  private coinListeners = new Map<string, Set<(price: number) => void>>();
  private tradesListeners = new Map<string, Set<(trades: Trade[]) => void>>();
  
  // Reconnection state
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Throttled update buffers
  private updateBuffer = new Map<string, number>();
  private tradesUpdateBuffer = new Map<string, Trade[]>();
  private throttleInterval: NodeJS.Timeout | null = null;
  private throttleTime = 300; // Emit updates every 300ms

  // Mock pricing/trades fallback for local demo and testing
  private mockInterval: NodeJS.Timeout | null = null;
  private mockTradesInterval: NodeJS.Timeout | null = null;
  private mockPrices = new Map<string, number>([
    ["bitcoin", 64248.5],
    ["ethereum", 3450.25],
    ["solana", 145.8],
    ["cardano", 0.48],
    ["ripple", 0.58],
    ["polkadot", 6.2],
    ["dogecoin", 0.12],
  ]);

  constructor() {
    // Start the throttling emitter
    this.startThrottleEmitter();
  }

  public getStatus(): WSStatus {
    return this.status;
  }

  // --- Public Subscription API ---

  public subscribe(coinId: string, callback: (price: number) => void) {
    const cleanId = coinId.toLowerCase();
    
    if (!this.coinListeners.has(cleanId)) {
      this.coinListeners.set(cleanId, new Set());
      // First subscriber for this coin -> send subscription command to WS
      this.sendSubscriptionCommand("subscribe", cleanId);
    }
    
    this.coinListeners.get(cleanId)!.add(callback);

    // If socket is disconnected, try to open connection
    if (this.status === "disconnected" && !this.reconnectTimer) {
      this.connect();
    } else {
      // Ensure local fallback ticker is running if connection is active
      this.startMockSimulation();
    }
  }

  public unsubscribe(coinId: string, callback: (price: number) => void) {
    const cleanId = coinId.toLowerCase();
    const listeners = this.coinListeners.get(cleanId);
    
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.coinListeners.delete(cleanId);
        // No more subscribers for this coin -> unsubscribe command on WS
        this.sendSubscriptionCommand("unsubscribe", cleanId);
      }
    }

    this.checkDisconnectCondition();
  }

  public subscribeTrades(pairId: string, callback: (trades: Trade[]) => void) {
    const cleanId = pairId.toLowerCase();
    console.log(`[WS Debug] subscribeTrades called for: ${cleanId}. status: ${this.status}`);
    
    if (!this.tradesListeners.has(cleanId)) {
      this.tradesListeners.set(cleanId, new Set());
      // First subscriber for this trades pair -> send subscription command to WS
      this.sendSubscriptionCommand("subscribe_trades", cleanId);
    }
    
    this.tradesListeners.get(cleanId)!.add(callback);

    // If socket is disconnected, try to open connection
    if (this.status === "disconnected" && !this.reconnectTimer) {
      this.connect();
    } else {
      // Ensure local trades fallback ticker is active if connection is active
      console.log(`[WS Debug] Already connected. Starting mock trades simulation.`);
      this.startMockTradesSimulation();
    }
  }

  public unsubscribeTrades(pairId: string, callback: (trades: Trade[]) => void) {
    const cleanId = pairId.toLowerCase();
    const listeners = this.tradesListeners.get(cleanId);
    
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.tradesListeners.delete(cleanId);
        // No more subscribers for this pair -> unsubscribe command on WS
        this.sendSubscriptionCommand("unsubscribe_trades", cleanId);
      }
    }

    this.checkDisconnectCondition();
  }

  private checkDisconnectCondition() {
    // Close connection if no active listeners remain for either ticker prices or trades
    if (this.coinListeners.size === 0 && this.tradesListeners.size === 0) {
      this.disconnect();
    }
  }

  public registerStatusListener(callback: (status: WSStatus) => void) {
    this.statusListeners.add(callback);
    // Push current status immediately
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  // --- Connection Management ---

  private connect() {
    console.log(`[WS Debug] connect() called. Current status: ${this.status}, socket: ${!!this.socket}, listeners: ${this.statusListeners.size}`);
    if (this.socket) return;

    this.updateStatus("reconnecting");
    
    // Configure the official CoinGecko WebSocket URL.
    const wsUrl = process.env.NEXT_PUBLIC_COINGECKO_WS_URL || "";

    if (!wsUrl) {
      console.warn("[WS] No WebSocket URL provided in environment variables. Falling back to local simulation.");
      this.startMockSimulation();
      this.startMockTradesSimulation();
      this.updateStatus("connected");
      console.log(`[WS Debug] Fallback connection finished. status: ${this.status}`);
      return;
    }

    try {
      console.log(`[WS] Connecting to ${wsUrl}...`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("[WS] Connection established.");
        this.updateStatus("connected");
        this.reconnectAttempts = 0;
        this.stopMockSimulation();
        this.stopMockTradesSimulation();
        this.resubscribeAll();
      };

      this.socket.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };

      this.socket.onerror = (error) => {
        console.error("[WS] Error occurred:", error);
      };

      this.socket.onclose = () => {
        console.warn("[WS] Connection closed.");
        this.socket = null;
        this.updateStatus("disconnected");
        this.scheduleReconnection();
      };
    } catch (err) {
      console.error("[WS] Exception starting socket:", err);
      this.scheduleReconnection();
    }
  }

  private disconnect() {
    this.stopMockSimulation();
    this.stopMockTradesSimulation();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus("disconnected");
  }

  private updateStatus(newStatus: WSStatus) {
    console.log(`[WS Debug] updateStatus called: changing from ${this.status} to ${newStatus}. Listeners: ${this.statusListeners.size}`);
    this.status = newStatus;
    const listenersArray = Array.from(this.statusListeners);
    listenersArray.forEach((listener, i) => {
      console.log(`[WS Debug] notifying statusListener #${i} (newStatus: ${newStatus})`);
      listener(newStatus);
    });
  }

  private scheduleReconnection() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`[WS] Scheduling reconnection attempt #${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);

    // Turn on simulation fallback during reconnect attempts so dashboard data stays live
    this.startMockSimulation();
    this.startMockTradesSimulation();
  }

  // --- Messaging Core ---

  private sendSubscriptionCommand(action: string, id: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    let message;
    if (action.endsWith("_trades")) {
      // TODO: Verify on-chain trades subscription message payload structure with CoinGecko.
      // E.g. subscribing to trade events for a specific DEX pool address or pair
      message = {
        action: action.replace("_trades", ""),
        params: {
          channel: "trades",
          pair_id: id
        }
      };
    } else {
      message = {
        action: action,
        params: {
          channel: "ticker",
          coin_ids: id
        }
      };
    }

    console.log(`[WS] Sending command:`, message);
    this.socket.send(JSON.stringify(message));
  }

  private resubscribeAll() {
    this.coinListeners.forEach((_, coinId) => {
      this.sendSubscriptionCommand("subscribe", coinId);
    });
    this.tradesListeners.forEach((_, pairId) => {
      this.sendSubscriptionCommand("subscribe_trades", pairId);
    });
  }

  private handleIncomingMessage(rawData: string) {
    try {
      const data = JSON.parse(rawData);
      
      // Parser 1: Price tickers
      if (data && data.channel === "ticker" && data.coin_id && data.price) {
        const coinId = data.coin_id.toLowerCase();
        const price = parseFloat(data.price);
        this.updateBuffer.set(coinId, price);
      }
      
      // Parser 2: On-chain trades
      // TODO: Verify incoming raw message parameters based on CoinGecko API.
      // Expected schema structure: { channel: "trades", pair_id: "bitcoin/usd", trade: { id, time, side, price, amount } }
      if (data && data.channel === "trades" && data.pair_id && data.trade) {
        const pairId = data.pair_id.toLowerCase();
        const rawTrade = data.trade;
        const newTrade: Trade = {
          id: rawTrade.id || Math.random().toString(36).substring(2, 9).toUpperCase(),
          time: rawTrade.time || new Date().toLocaleTimeString([], { hour12: false }),
          side: rawTrade.side === "sell" ? "sell" : "buy",
          price: parseFloat(rawTrade.price),
          amount: parseFloat(rawTrade.amount),
          total: parseFloat(rawTrade.price) * parseFloat(rawTrade.amount)
        };

        if (!this.tradesUpdateBuffer.has(pairId)) {
          this.tradesUpdateBuffer.set(pairId, []);
        }
        this.tradesUpdateBuffer.get(pairId)!.push(newTrade);
      }
    } catch (err) {
      console.error("[WS] Error parsing incoming raw message:", err);
    }
  }

  // --- Buffering / Throttling Engine ---

  private startThrottleEmitter() {
    if (this.throttleInterval) return;

    this.throttleInterval = setInterval(() => {
      // 1. Emit price updates
      if (this.updateBuffer.size > 0) {
        this.updateBuffer.forEach((price, coinId) => {
          const listeners = this.coinListeners.get(coinId);
          if (listeners) {
            listeners.forEach((callback) => callback(price));
          }
        });
        this.updateBuffer.clear();
      }

      // 2. Emit trade updates
      if (this.tradesUpdateBuffer.size > 0) {
        this.tradesUpdateBuffer.forEach((tradesBatch, pairId) => {
          const listeners = this.tradesListeners.get(pairId);
          if (listeners) {
            listeners.forEach((callback) => callback(tradesBatch));
          }
        });
        this.tradesUpdateBuffer.clear();
      }
    }, this.throttleTime);
  }

  // --- Local Demo Simulation Fallbacks ---

  private startMockSimulation() {
    if (this.mockInterval) return;

    this.mockInterval = setInterval(() => {
      this.coinListeners.forEach((_, coinId) => {
        let price = this.mockPrices.get(coinId);
        if (price === undefined) {
          price = 100.0;
        }

        // Apply random walk (±0.08%)
        const pct = (Math.random() - 0.5) * 0.0016;
        const newPrice = price * (1 + pct);
        this.mockPrices.set(coinId, newPrice);

        this.updateBuffer.set(coinId, newPrice);
      });
    }, 800);
  }

  private stopMockSimulation() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  private startMockTradesSimulation() {
    console.log(`[WS Debug] startMockTradesSimulation called. Interval exists: ${!!this.mockTradesInterval}, tradesListeners keys: ${Array.from(this.tradesListeners.keys()).join(", ")}`);
    if (this.mockTradesInterval) return;

    this.mockTradesInterval = setInterval(() => {
      this.tradesListeners.forEach((_, pairId) => {
        const coinId = pairId.split("/")[0] || "bitcoin";
        const basePrice = this.mockPrices.get(coinId) || 100.0;

        // Generate random trade
        const side = Math.random() > 0.45 ? "buy" : "sell";
        const priceSpread = (Math.random() - 0.5) * 0.0015; // ±0.075% spread
        const price = basePrice * (1 + priceSpread);
        
        let maxAmount = 1.5;
        if (coinId === "ethereum") maxAmount = 5;
        else if (coinId === "solana") maxAmount = 25;
        else if (coinId === "cardano" || coinId === "ripple" || coinId === "polkadot" || coinId === "dogecoin") maxAmount = 2500;
        
        const amount = Math.random() * maxAmount + 0.005;
        const total = price * amount;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const id = Math.random().toString(36).substring(2, 10).toUpperCase();

        const trade: Trade = { id, time, side, price, amount, total };

        if (!this.tradesUpdateBuffer.has(pairId)) {
          this.tradesUpdateBuffer.set(pairId, []);
        }
        this.tradesUpdateBuffer.get(pairId)!.push(trade);
      });
    }, 450); // New trade events every 450ms
  }

  private stopMockTradesSimulation() {
    if (this.mockTradesInterval) {
      clearInterval(this.mockTradesInterval);
      this.mockTradesInterval = null;
    }
  }
}

// Export singleton manager instance
export const wsManager = new CoinGeckoWSManager();
