// WebSocket Event Types

export interface RoundStartEvent {
  type: 'ROUND_START';
  data: {
    roundId: string;
    p0: number;
    serverTsClose: number; // When round closes (server timestamp)
  };
}

export interface ChoiceSubmitEvent {
  type: 'CHOICE_SUBMIT';
  data: {
    roundId: string;
    choice: 'UP' | 'DOWN';
    clientTs: number;
  };
}

export interface ChoiceAckEvent {
  type: 'CHOICE_ACK';
  data: {
    roundId: string;
    accepted: boolean;
    reason?: string; // If not accepted
  };
}

export interface RoundResultEvent {
  type: 'ROUND_RESULT';
  data: {
    roundId: string;
    p1: number;
    result: 'WIN' | 'LOSE' | 'DRAW' | 'VOID';
    pointsDelta: number;
    totalPoints: number;
  };
}

export interface LeaderboardEvent {
  type: 'LEADERBOARD';
  data: {
    top10: Array<{
      wallet: string;
      points: number;
    }>;
    yourRank?: number;
    yourPoints: number;
  };
}

export interface WalletConnectedEvent {
  type: 'WALLET_CONNECTED';
  data: {
    wallet: string;
    totalPoints: number;
  };
}

export interface AskTelegramEvent {
  type: 'ASK_TELEGRAM';
  data: {
    reason: '10_rounds' | 'exit_game';
  };
}

export interface PriceUpdateEvent {
  type: 'PRICE_UPDATE';
  data: {
    symbol: string;
    price: number;
    timestamp: number;
    change24h?: number;
  };
}

export interface CandlestickHistoryEvent {
  type: 'CANDLESTICK_HISTORY';
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface WalletConnectEvent {
  type: 'WALLET_CONNECT';
  data: {
    address: string;
    message: string;
    signature: string;
  };
}

export type ServerToClientEvent = 
  | RoundStartEvent
  | ChoiceAckEvent
  | RoundResultEvent
  | LeaderboardEvent
  | WalletConnectedEvent
  | AskTelegramEvent
  | PriceUpdateEvent
  | CandlestickHistoryEvent;

export type ClientToServerEvent = 
  | ChoiceSubmitEvent
  | WalletConnectEvent;

// Constants
export const ROUND_DURATION_MS = 10 * 1000; // 10 seconds
export const ANTI_CHEAT_BUFFER_MS = 250; // Close betting 250ms before round end
export const PRICE_FEED_TIMEOUT_MS = 2 * 1000; // Void round if price feed lags > 2s
export const POINTS_PER_WIN = 10;
