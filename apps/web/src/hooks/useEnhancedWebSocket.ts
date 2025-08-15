import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  ServerToClientEvent, 
  ClientToServerEvent, 
  GameState,
  PriceCandleData
} from '@predictor/shared';
import { ROUND_DURATION_MS } from '@predictor/shared';

interface EnhancedWebSocketHook {
  gameState: GameState;
  isConnected: boolean;
  submitChoice: (choice: 'UP' | 'DOWN') => void;
  connectWallet: (authData: { address: string; message: string; signature: string }) => void;
  exitGame: () => void;
  lastResult: 'WIN' | 'LOSE' | 'DRAW' | null;
  currentPrice: number;
  priceHistory: PriceCandleData[];
  totalPoints: number;
}

export const useEnhancedWebSocket = (serverUrl: string = 'ws://localhost:3001/ws'): EnhancedWebSocketHook => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const sessionId = useRef<string>('');

  const [isConnected, setIsConnected] = useState(false);
  const [lastResult, setLastResult] = useState<'WIN' | 'LOSE' | 'DRAW' | null>(null);
  const [currentPrice, setCurrentPrice] = useState(50000);
  const [priceHistory, setPriceHistory] = useState<PriceCandleData[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    playerChoice: null,
    playerPoints: 0,
    isConnected: false,
    wallet: undefined,
  });

  // Generate session ID on first load
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = `guest_${Math.random().toString(36).substring(2, 15)}`;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to game server');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        setGameState(prev => ({
          ...prev,
          isConnected: true,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: ServerToClientEvent = JSON.parse(event.data);
          console.log('📨 Received:', message.type, message.data);

          switch (message.type) {
            case 'ROUND_START':
              setGameState(prev => ({
                ...prev,
                currentRound: {
                  roundId: message.data.roundId,
                  startTime: Date.now(),
                  endTime: Date.now() + ROUND_DURATION_MS,
                  p0: message.data.p0,
                  isActive: true,
                },
                playerChoice: null,
              }));
              setLastResult(null);
              break;

            case 'ROUND_RESULT':
              const { result, pointsDelta, totalPoints: newTotal } = message.data;
              setLastResult(result);
              setTotalPoints(newTotal);
              
              setGameState(prev => ({
                ...prev,
                currentRound: prev.currentRound ? {
                  ...prev.currentRound,
                  isActive: false,
                } : null,
                playerPoints: newTotal,
              }));

              // Clear result after 3 seconds
              setTimeout(() => setLastResult(null), 3000);
              break;

            case 'CHOICE_ACK':
              if (message.data.accepted) {
                console.log('✅ Choice accepted');
              } else {
                console.log('❌ Choice rejected:', message.data.reason);
                setGameState(prev => ({
                  ...prev,
                  playerChoice: null,
                }));
              }
              break;

            case 'PRICE_UPDATE':
              const { price, timestamp } = message.data;
              setCurrentPrice(price);
              
              // Add to price history as candlestick data
              setPriceHistory(prev => {
                const newCandle: PriceCandleData = {
                  time: Math.floor(timestamp / 1000),
                  open: prev.length > 0 ? prev[prev.length - 1].close : price,
                  high: price,
                  low: price,
                  close: price,
                };

                const updated = [...prev];
                
                // If this is for the same second, update the existing candle
                if (updated.length > 0 && updated[updated.length - 1].time === newCandle.time) {
                  const lastCandle = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...lastCandle,
                    high: Math.max(lastCandle.high, price),
                    low: Math.min(lastCandle.low, price),
                    close: price,
                  };
                } else {
                  updated.push(newCandle);
                }

                // Keep only last 100 candles
                return updated.slice(-100);
              });
              break;

            case 'WALLET_CONNECTED':
              setGameState(prev => ({
                ...prev,
                wallet: message.data.wallet,
              }));
              setTotalPoints(message.data.totalPoints);
              break;

            case 'LEADERBOARD':
              // Handle leaderboard data if needed
              break;

            default:
              console.log('🤷 Unknown message type:', message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from game server');
        setIsConnected(false);
        setGameState(prev => ({
          ...prev,
          isConnected: false,
        }));

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          setTimeout(connect, 2000 * reconnectAttempts.current);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
    }
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: ClientToServerEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const submitChoice = useCallback((choice: 'UP' | 'DOWN') => {
    if (!gameState.currentRound) return;

    setGameState(prev => ({
      ...prev,
      playerChoice: choice,
    }));

    sendMessage({
      type: 'CHOICE_SUBMIT',
      data: {
        roundId: gameState.currentRound.roundId,
        choice,
        clientTs: Date.now(),
      },
    });
  }, [gameState.currentRound, sendMessage]);

  const connectWallet = useCallback((authData: { address: string; message: string; signature: string }) => {
    sendMessage({
      type: 'WALLET_CONNECT',
      data: authData,
    });
  }, [sendMessage]);

  const exitGame = useCallback(() => {
    disconnect();
    // You might want to navigate to a different page here
    window.location.reload();
  }, [disconnect]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    gameState,
    isConnected,
    submitChoice,
    connectWallet,
    exitGame,
    lastResult,
    currentPrice,
    priceHistory,
    totalPoints,
  };
};
