import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { 
  ROUND_DURATION_MS, 
  ANTI_CHEAT_BUFFER_MS, 
  PRICE_FEED_TIMEOUT_MS,
  POINTS_PER_WIN,
  RoundStartEvent,
  RoundResultEvent,
  RoundRecord
} from '@predictor/shared';

export interface Round {
  id: string;
  startTime: number;
  endTime: number;
  p0: number;
  p1?: number;
  isActive: boolean;
  bettingClosed: boolean;
  choices: Map<string, { choice: 'UP' | 'DOWN'; timestamp: number }>;
}

export class GameEngine extends EventEmitter {
  private currentRound: Round | null = null;
  private priceHistory: Array<{ timestamp: number; price: number }> = [];
  private roundInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startRoundLoop();
  }

  private startRoundLoop() {
    this.startNewRound();
    
    this.roundInterval = setInterval(() => {
      this.startNewRound();
    }, ROUND_DURATION_MS + 2000); // 2 second break between rounds
  }

  private startNewRound() {
    const now = Date.now();
    const roundId = nanoid();
    const p0 = this.getCurrentPrice();

    this.currentRound = {
      id: roundId,
      startTime: now,
      endTime: now + ROUND_DURATION_MS,
      p0,
      isActive: true,
      bettingClosed: false,
      choices: new Map(),
    };

    // Store price for history
    this.priceHistory.push({ timestamp: now, price: p0 });
    if (this.priceHistory.length > 60) {
      this.priceHistory.shift(); // Keep only last 60 data points
    }

    // Schedule betting close (anti-cheat buffer)
    setTimeout(() => {
      if (this.currentRound?.id === roundId) {
        this.currentRound.bettingClosed = true;
        console.log(`Round ${roundId}: Betting closed (anti-cheat buffer)`);
      }
    }, ROUND_DURATION_MS - ANTI_CHEAT_BUFFER_MS);

    // Schedule round end
    setTimeout(() => {
      this.endRound(roundId);
    }, ROUND_DURATION_MS);

    // Emit round start event
    const roundStartEvent: RoundStartEvent = {
      type: 'ROUND_START',
      data: {
        roundId,
        p0,
        serverTsClose: now + ROUND_DURATION_MS - ANTI_CHEAT_BUFFER_MS,
      },
    };

    this.emit('roundStart', roundStartEvent);
    console.log(`Round ${roundId} started: P0=${p0}, Duration=${ROUND_DURATION_MS}ms`);
  }

  private endRound(roundId: string) {
    if (!this.currentRound || this.currentRound.id !== roundId) {
      return; // Round already ended or different round
    }

    const round = this.currentRound;
    round.isActive = false;

    const p1 = this.getCurrentPrice();
    round.p1 = p1;

    // Calculate results for each player
    for (const [identity, choiceData] of round.choices) {
      const { choice } = choiceData;
      let result: 'WIN' | 'LOSE' | 'DRAW' | 'VOID' = 'VOID';

      if (p1 === round.p0) {
        result = 'DRAW';
      } else if (
        (choice === 'UP' && p1 > round.p0) ||
        (choice === 'DOWN' && p1 < round.p0)
      ) {
        result = 'WIN';
      } else {
        result = 'LOSE';
      }

      const pointsDelta = result === 'WIN' ? POINTS_PER_WIN : 0;

      const roundResultEvent: RoundResultEvent = {
        type: 'ROUND_RESULT',
        data: {
          roundId,
          p1,
          result,
          pointsDelta,
          totalPoints: 0, // Will be updated by session manager
        },
      };

      this.emit('roundResult', identity, roundResultEvent);

      // Create round record for CSV logging
      const roundRecord: RoundRecord = {
        timestamp: Date.now(),
        roundId,
        identity,
        choice,
        p0: round.p0,
        p1,
        result,
        latencyMs: Date.now() - choiceData.timestamp,
      };

      this.emit('roundRecord', roundRecord);
    }

    console.log(`Round ${roundId} ended: P0=${round.p0}, P1=${p1}, Choices=${round.choices.size}`);
  }

  public submitChoice(identity: string, choice: 'UP' | 'DOWN'): boolean {
    if (!this.currentRound || !this.currentRound.isActive || this.currentRound.bettingClosed) {
      return false;
    }

    // Check if player already made a choice this round
    if (this.currentRound.choices.has(identity)) {
      return false;
    }

    this.currentRound.choices.set(identity, {
      choice,
      timestamp: Date.now(),
    });

    console.log(`Choice submitted: ${identity} -> ${choice} (Round: ${this.currentRound.id})`);
    return true;
  }

  public getCurrentRound(): Round | null {
    return this.currentRound;
  }

  public getPriceHistory(): Array<{ timestamp: number; price: number }> {
    return [...this.priceHistory];
  }

  private getCurrentPrice(): number {
    // Mock price feed - random walk around 50000
    if (this.priceHistory.length === 0) {
      return 50000;
    }

    const lastPrice = this.priceHistory[this.priceHistory.length - 1].price;
    const change = (Math.random() - 0.5) * 1000; // +/- 500 max change
    return Math.max(30000, Math.min(70000, lastPrice + change));
  }

  public destroy() {
    if (this.roundInterval) {
      clearInterval(this.roundInterval);
      this.roundInterval = null;
    }
  }
}
