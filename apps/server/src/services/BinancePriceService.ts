import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class BinancePriceService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentPrice = 50000; // Fallback price
  private priceHistory: PriceData[] = [];
  private mockMode = false;

  constructor(mockMode = false) {
    super();
    this.mockMode = mockMode;
    if (mockMode) {
      this.startMockPriceGenerator();
    } else {
      this.connect();
    }
  }

  private connect() {
    try {
      console.log('🔌 Connecting to Binance WebSocket...');
      this.ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
      
      this.ws.on('open', () => {
        console.log('✅ Connected to Binance WebSocket');
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const ticker = JSON.parse(data.toString());
          const priceData: PriceData = {
            symbol: ticker.s,
            price: parseFloat(ticker.c),
            timestamp: Date.now(),
            open: parseFloat(ticker.o),
            high: parseFloat(ticker.h),
            low: parseFloat(ticker.l),
            close: parseFloat(ticker.c),
            volume: parseFloat(ticker.v)
          };
          
          this.currentPrice = priceData.price;
          this.addToHistory(priceData);
          this.emit('priceUpdate', priceData);
        } catch (error) {
          console.error('Error parsing Binance data:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('❌ Binance WebSocket connection closed');
        this.reconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ Binance WebSocket error:', error);
        this.reconnect();
      });

    } catch (error) {
      console.error('Failed to connect to Binance:', error);
      this.fallbackToMockMode();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting to Binance (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), 5000 * this.reconnectAttempts);
    } else {
      console.log('🚨 Max reconnection attempts reached, falling back to mock mode');
      this.fallbackToMockMode();
    }
  }

  private fallbackToMockMode() {
    this.mockMode = true;
    this.startMockPriceGenerator();
  }

  private startMockPriceGenerator() {
    console.log('🎮 Starting mock price generator');
    setInterval(() => {
      const change = (Math.random() - 0.5) * 1000; // ±$500 change
      this.currentPrice = Math.max(10000, this.currentPrice + change);
      
      const priceData: PriceData = {
        symbol: 'BTCUSDT',
        price: this.currentPrice,
        timestamp: Date.now(),
        open: this.currentPrice - change,
        high: this.currentPrice + Math.abs(change) * 0.5,
        low: this.currentPrice - Math.abs(change) * 0.5,
        close: this.currentPrice,
        volume: Math.random() * 1000
      };
      
      this.addToHistory(priceData);
      this.emit('priceUpdate', priceData);
    }, 1000);
  }

  private addToHistory(priceData: PriceData) {
    this.priceHistory.push(priceData);
    // Keep only last 100 price points
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100);
    }
  }

  public getCurrentPrice(): number {
    return this.currentPrice;
  }

  public getPriceHistory(): PriceData[] {
    return [...this.priceHistory];
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
