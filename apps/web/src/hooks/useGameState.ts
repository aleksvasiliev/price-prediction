import { useState, useCallback } from 'react';
import type { GameState } from '@predictor/shared';
import { ROUND_DURATION_MS } from '@predictor/shared';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    playerChoice: null,
    playerPoints: 0,
    isConnected: false,
    wallet: undefined,
  });

  const startMockRound = useCallback(() => {
    const now = Date.now();
    const roundId = `round_${now}`;
    const p0 = 45000 + Math.random() * 10000; // Mock BTC price

    setGameState(prev => ({
      ...prev,
      currentRound: {
        roundId,
        startTime: now,
        endTime: now + ROUND_DURATION_MS,
        p0,
        isActive: true,
      },
      playerChoice: null,
    }));

    // Auto end round after duration
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentRound: prev.currentRound ? {
          ...prev.currentRound,
          isActive: false,
        } : null,
      }));
    }, ROUND_DURATION_MS);
  }, []);

  const selectChoice = useCallback((choice: 'UP' | 'DOWN') => {
    setGameState(prev => ({
      ...prev,
      playerChoice: choice,
    }));
  }, []);

  const connectWallet = useCallback(() => {
    // Mock wallet connection
    const mockWallet = '0x1234...5678';
    setGameState(prev => ({
      ...prev,
      wallet: mockWallet,
      isConnected: true,
    }));
  }, []);

  const exitGame = useCallback(() => {
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
    startMockRound,
    selectChoice,
    connectWallet,
    exitGame,
  };
};
