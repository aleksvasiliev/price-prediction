export interface GameState {
  currentRound: {
    roundId: string;
    startTime: number;
    endTime: number;
    p0: number; // Price at round start
    isActive: boolean;
  } | null;
  playerChoice: 'UP' | 'DOWN' | null;
  playerPoints: number;
  isConnected: boolean;
  wallet?: string;
}

export interface RoundResult {
  roundId: string;
  p0: number;
  p1: number;
  result: 'WIN' | 'LOSE' | 'DRAW' | 'VOID';
  pointsEarned: number;
  totalPoints: number;
}

export interface LeaderboardEntry {
  wallet: string;
  points: number;
  rank: number;
}

export interface PlayerSession {
  sessionId: string;
  tempPoints: number;
  isGuest: boolean;
  wallet?: string;
}

// CSV Storage Types
export interface PlayerRecord {
  wallet: string;
  points: number;
  telegramHandle?: string;
}

export interface SessionRecord {
  sessionId: string;
  tempPoints: number;
  createdAt: number;
  lastSeen: number;
  isGuest: boolean;
}

export interface RoundRecord {
  timestamp: number;
  roundId: string;
  identity: string; // wallet or sessionId
  choice: 'UP' | 'DOWN';
  p0: number;
  p1: number;
  result: 'WIN' | 'LOSE' | 'DRAW' | 'VOID';
  latencyMs: number;
}

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

export interface PriceCandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
