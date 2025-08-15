import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { 
  ROUND_DURATION_MS, 
  ANTI_CHEAT_BUFFER_MS, 
  PRICE_FEED_TIMEOUT_MS,
  POINTS_PER_WIN,
  RoundStartEvent,
  RoundResultEvent,
  RoundRecord,
  PriceUpdateEvent
} from '@predictor/shared';
import { BinancePriceService, PriceData } from '../services/BinancePriceService';

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

export class EnhancedGameEngine extends EventEmitter {
  private currentRound: Round | null = null;
  private priceService: BinancePriceService;
  private currentPrice = 50000;
  private roundTimeout: NodeJS.Timeout | null = null;
  private antiCheatTimeout: NodeJS.Timeout | null = null;

  constructor(useMockPrices = false) {
    super();
    this.priceService = new BinancePriceService(useMockPrices);
    
    this.priceService.on('priceUpdate', (priceData: PriceData) => {
      this.currentPrice = priceData.price;
      
      // Emit price update to all clients
      this.emit('priceUpdate', {
        type: 'PRICE_UPDATE',
        data: {
          symbol: priceData.symbol,
          price: priceData.price,
          timestamp: priceData.timestamp
        }
      } as PriceUpdateEvent);
    });

    this.startNewRound();
  }

  private startNewRound() {
    const round: Round = {
      id: nanoid(),
      startTime: Date.now(),
      endTime: Date.now() + ROUND_DURATION_MS,
      p0: this.currentPrice,
      isActive: true,
      bettingClosed: false,
      choices: new Map(),
    };

    this.currentRound = round;

    console.log(`Round ${round.id} started: P0=${round.p0}, Duration=${ROUND_DURATION_MS}ms`);

    // Emit round start event
    this.emit('roundStart', {
      type: 'ROUND_START',
      data: {
        roundId: round.id,
        p0: round.p0,
        serverTsClose: round.endTime - ANTI_CHEAT_BUFFER_MS,
      },
    } as RoundStartEvent);

    // Schedule anti-cheat buffer (close betting early)
    this.antiCheatTimeout = setTimeout(() => {
      if (this.currentRound && this.currentRound.id === round.id) {
        this.currentRound.bettingClosed = true;
        console.log(`Round ${round.id}: Betting closed (anti-cheat buffer)`);
      }
    }, ROUND_DURATION_MS - ANTI_CHEAT_BUFFER_MS);

    // Schedule round end
    this.roundTimeout = setTimeout(() => {
      this.endRound(round.id, this.currentPrice);
    }, ROUND_DURATION_MS);
  }

  public submitChoice(identity: string, choice: 'UP' | 'DOWN', clientTs: number): boolean {
    if (!this.currentRound || this.currentRound.bettingClosed) {
      return false;
    }

    this.currentRound.choices.set(identity, {
      choice,
      timestamp: Date.now(),
    });

    console.log(`Choice submitted: ${identity} -> ${choice} (Round: ${this.currentRound.id})`);
    return true;
  }

  private async endRound(roundId: string, p1: number) {
    if (!this.currentRound || this.currentRound.id !== roundId) {
      return;
    }

    const round = this.currentRound;
    round.p1 = p1;
    round.isActive = false;

    console.log(`Round ${roundId} ended: P0=${round.p0}, P1=${p1}, Choices=${round.choices.size}`);

    // Process all choices and emit results
    for (const [identity, choiceData] of round.choices.entries()) {
      const { choice } = choiceData;
      
      let result: 'WIN' | 'LOSE' | 'DRAW' | 'VOID';
      let pointsDelta = 0;

      if (p1 > round.p0 && choice === 'UP') {
        result = 'WIN';
        pointsDelta = POINTS_PER_WIN;
      } else if (p1 < round.p0 && choice === 'DOWN') {
        result = 'WIN';
        pointsDelta = POINTS_PER_WIN;
      } else if (p1 === round.p0) {
        result = 'DRAW';
        pointsDelta = 0;
      } else {
        result = 'LOSE';
        pointsDelta = 0;
      }

      // Emit round result for this player
      this.emit('roundResult', {
        identity,
        roundId,
        result,
        pointsDelta,
        p1,
      });

      // Create round record for storage
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

    this.currentRound = null;

    // Start next round after a brief pause
    setTimeout(() => {
      this.startNewRound();
    }, 1000);
  }

  public getCurrentRound(): Round | null {
    return this.currentRound;
  }

  public getCurrentPrice(): number {
    return this.currentPrice;
  }

  public getPriceHistory() {
    return this.priceService.getPriceHistory();
  }

  public disconnect() {
    if (this.roundTimeout) {
      clearTimeout(this.roundTimeout);
    }
    if (this.antiCheatTimeout) {
      clearTimeout(this.antiCheatTimeout);
    }
    this.priceService.disconnect();
  }
}
