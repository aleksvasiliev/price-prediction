import WebSocket from 'ws';
import { EventEmitter } from 'events';
import https from 'https';

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

export interface CandlestickData {
  time: number;
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
  private candlestickHistory: CandlestickData[] = [];
  private mockMode = false;

  constructor(mockMode = false) {
    super();
    this.mockMode = mockMode;
    if (mockMode) {
      this.startMockPriceGenerator();
    } else {
      this.fetchHistoricalData().then(() => {
        this.connect();
      });
    }
  }

  private async fetchHistoricalData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.binance.com',
        path: '/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100',
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const klines = JSON.parse(data);
            this.candlestickHistory = klines.map((kline: any[]) => ({
              time: kline[0], // Open time
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
              volume: parseFloat(kline[5])
            }));
            
            console.log(`📊 Loaded ${this.candlestickHistory.length} historical candlesticks`);
            
            // Set current price from latest candle
            if (this.candlestickHistory.length > 0) {
              const latest = this.candlestickHistory[this.candlestickHistory.length - 1];
              this.currentPrice = latest.close;
            }
            
            // Emit initial candlestick data
            this.emit('candlestickHistory', this.candlestickHistory);
            resolve();
          } catch (error) {
            console.error('❌ Error parsing historical data:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error fetching historical data:', error);
        reject(error);
      });

      req.end();
    });
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

  public getCandlestickHistory(): CandlestickData[] {
    return [...this.candlestickHistory];
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
