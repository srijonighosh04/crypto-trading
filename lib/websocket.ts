export type WSStatus = "connected" | "reconnecting" | "disconnected";

interface CacheEntry {
  price: number;
  timestamp: number;
}

class CoinGeckoWSManager {
  private socket: WebSocket | null = null;
  private status: WSStatus = "disconnected";
  private statusListeners = new Set<(status: WSStatus) => void>();
  private coinListeners = new Map<string, Set<(price: number) => void>>();
  
  // Reconnection state
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Throttled update buffer
  private updateBuffer = new Map<string, number>();
  private throttleInterval: NodeJS.Timeout | null = null;
  private throttleTime = 300; // Emit updates every 300ms

  // Mock pricing fallback for local demo and testing
  private mockInterval: NodeJS.Timeout | null = null;
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

    // Optional: close connection if no active coin subscriptions remain
    if (this.coinListeners.size === 0) {
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
    if (this.socket) return;

    this.updateStatus("reconnecting");
    
    // TODO: Configure the official CoinGecko WebSocket URL.
    // Pro/Enterprise users use: "wss://ws.coingecko.com/v2/"
    const wsUrl = process.env.NEXT_PUBLIC_COINGECKO_WS_URL || "";

    if (!wsUrl) {
      console.warn("[WS] No WebSocket URL provided in environment variables. Falling back to local simulation.");
      this.startMockSimulation();
      this.updateStatus("connected");
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
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }

  private scheduleReconnection() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    // Exponential backoff reconnect timing
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`[WS] Scheduling reconnection attempt #${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);

    // Turn on simulation fallback during reconnect attempts so dashboard data stays live
    this.startMockSimulation();
  }

  // --- Messaging Core ---

  private sendSubscriptionCommand(action: "subscribe" | "unsubscribe", coinId: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // TODO: Verify the subscription message payload structure with CoinGecko documentation.
    // This is a typical placeholder shape for CoinGecko's ticker channel.
    const message = {
      action: action,
      params: {
        channel: "ticker",
        coin_ids: coinId
      }
    };

    console.log(`[WS] Sending command:`, message);
    this.socket.send(JSON.stringify(message));
  }

  private resubscribeAll() {
    this.coinListeners.forEach((_, coinId) => {
      this.sendSubscriptionCommand("subscribe", coinId);
    });
  }

  private handleIncomingMessage(rawData: string) {
    try {
      const data = JSON.parse(rawData);
      
      // TODO: Custom parsing logic based on CoinGecko API format.
      // Expected schema structure: { channel: "ticker", coin_id: "bitcoin", price: 64248.5 }
      if (data && data.channel === "ticker" && data.coin_id && data.price) {
        const coinId = data.coin_id.toLowerCase();
        const price = parseFloat(data.price);
        
        // Push the update to our throttled buffer
        this.updateBuffer.set(coinId, price);
      }
    } catch (err) {
      console.error("[WS] Error parsing incoming raw message:", err);
    }
  }

  // --- Buffering / Throttling Engine ---

  private startThrottleEmitter() {
    if (this.throttleInterval) return;

    this.throttleInterval = setInterval(() => {
      if (this.updateBuffer.size === 0) return;

      // Flush buffer contents to listeners
      this.updateBuffer.forEach((price, coinId) => {
        const listeners = this.coinListeners.get(coinId);
        if (listeners) {
          listeners.forEach((callback) => callback(price));
        }
      });

      this.updateBuffer.clear();
    }, this.throttleTime);
  }

  // --- Local Demo Simulation Fallback ---

  private startMockSimulation() {
    if (this.mockInterval) return;

    this.mockInterval = setInterval(() => {
      this.coinListeners.forEach((_, coinId) => {
        // Retrieve current base price or default to random start
        let price = this.mockPrices.get(coinId);
        if (price === undefined) {
          price = 100.0;
        }

        // Apply a small random walk (±0.08%)
        const pct = (Math.random() - 0.5) * 0.0016;
        const newPrice = price * (1 + pct);
        this.mockPrices.set(coinId, newPrice);

        // Queue in throttle buffer
        this.updateBuffer.set(coinId, newPrice);
      });
    }, 800); // Ticks every 800ms
  }

  private stopMockSimulation() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}

// Export singleton manager instance
export const wsManager = new CoinGeckoWSManager();
