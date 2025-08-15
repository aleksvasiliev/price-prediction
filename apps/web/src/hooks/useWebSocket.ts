import { useEffect, useRef, useState, useCallback } from 'react';
import type { 
  ServerToClientEvent, 
  ClientToServerEvent, 
  GameState 
} from '@predictor/shared';
import { ROUND_DURATION_MS } from '@predictor/shared';

interface WebSocketHook {
  gameState: GameState;
  isConnected: boolean;
  submitChoice: (choice: 'UP' | 'DOWN') => void;
  connectWallet: () => void;
  exitGame: () => void;
  lastResult: 'WIN' | 'LOSE' | 'DRAW' | null;
}

export const useWebSocket = (serverUrl: string = 'ws://localhost:3001/ws'): WebSocketHook => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastResult, setLastResult] = useState<'WIN' | 'LOSE' | 'DRAW' | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    playerChoice: null,
    playerPoints: 0,
    isConnected: false,
    wallet: undefined,
  });

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(serverUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setGameState(prev => ({ ...prev, isConnected: true }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message: ServerToClientEvent = JSON.parse(event.data);
          
          switch (message.type) {
            case 'ROUND_START':
              const { roundId, p0, serverTsClose } = message.data;
              setGameState(prev => ({
                ...prev,
                currentRound: {
                  roundId,
                  startTime: Date.now(),
                  endTime: serverTsClose + 250, // Add back buffer for display
                  p0,
                  isActive: true,
                },
                playerChoice: null,
              }));
              break;

            case 'CHOICE_ACK':
              if (!message.data.accepted) {
                console.warn('Choice rejected:', message.data.reason);
                // Reset choice if rejected
                setGameState(prev => ({ ...prev, playerChoice: null }));
              }
              break;

            case 'ROUND_RESULT':
              const { p1, result, pointsDelta, totalPoints } = message.data;
              setGameState(prev => ({
                ...prev,
                playerPoints: totalPoints,
                currentRound: prev.currentRound ? {
                  ...prev.currentRound,
                  isActive: false,
                } : null,
              }));

              // Show result notification
              setLastResult(result);
              setTimeout(() => setLastResult(null), 3000); // Clear after 3 seconds
              
              console.log(`Round result: ${result}, Points: +${pointsDelta}, Total: ${totalPoints}`);
              break;

            case 'WALLET_CONNECTED':
              setGameState(prev => ({
                ...prev,
                wallet: message.data.wallet,
                playerPoints: message.data.totalPoints,
              }));
              break;

            case 'ASK_TELEGRAM':
              // TODO: Show telegram modal
              console.log('Ask telegram:', message.data.reason);
              break;

            case 'LEADERBOARD':
              // TODO: Handle leaderboard update
              console.log('Leaderboard update:', message.data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setGameState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [serverUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const submitChoice = useCallback((choice: 'UP' | 'DOWN') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !gameState.currentRound) {
      return;
    }

    const message: ClientToServerEvent = {
      type: 'CHOICE_SUBMIT',
      data: {
        roundId: gameState.currentRound.roundId,
        choice,
        clientTs: Date.now(),
      },
    };

    ws.current.send(JSON.stringify(message));
    
    // Optimistically update UI
    setGameState(prev => ({ ...prev, playerChoice: choice }));
  }, [gameState.currentRound]);

  const connectWallet = useCallback(() => {
    // Mock wallet connection for now
    const mockWallet = '0x' + Math.random().toString(16).slice(2, 42);
    setGameState(prev => ({
      ...prev,
      wallet: mockWallet,
    }));
    
    // In real implementation, this would trigger SIWE flow
    console.log('Mock wallet connected:', mockWallet);
  }, []);

  const exitGame = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    setGameState({
      currentRound: null,
      playerChoice: null,
      playerPoints: 0,
      isConnected: false,
      wallet: undefined,
    });
  }, []);

  return {
    gameState,
    isConnected,
    submitChoice,
    connectWallet,
    exitGame,
    lastResult,
  };
};
