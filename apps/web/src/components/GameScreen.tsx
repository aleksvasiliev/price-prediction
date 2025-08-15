import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '@predictor/shared';
import { useGameSounds } from '../hooks/useGameSounds';

interface GameScreenProps {
  gameState: GameState;
  onChoiceSelect: (choice: 'UP' | 'DOWN') => void;
  onConnectWallet: () => void;
  onExitGame: () => void;
  lastResult?: 'WIN' | 'LOSE' | 'DRAW' | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onChoiceSelect,
  onConnectWallet,
  onExitGame,
  lastResult: propLastResult,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playWin, playLose, playTick, setEnabled } = useGameSounds();

  // Play sound effects based on result
  useEffect(() => {
    if (propLastResult === 'WIN') {
      playWin();
    } else if (propLastResult === 'LOSE') {
      playLose();
    }
  }, [propLastResult, playWin, playLose]);

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  useEffect(() => {
    if (!gameState.currentRound?.isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = gameState.currentRound?.endTime ?? 0;
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      // Play tick sound on last 3 seconds
      if (remaining <= 3 && remaining > 0 && timeLeft !== remaining) {
        playTick();
      }
      
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.currentRound]);

  const isChoiceDisabled = !gameState.currentRound?.isActive || 
                          gameState.playerChoice !== null ||
                          timeLeft <= 0.25; // Anti-cheat buffer

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="text-white font-bold text-lg">
            🪙 {gameState.playerPoints} pts
          </div>
          {gameState.wallet ? (
            <div className="text-white/80 text-sm">
              {gameState.wallet.slice(0, 6)}...{gameState.wallet.slice(-4)}
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="text-yellow-300 text-sm hover:text-yellow-200 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={onExitGame}
            className="text-white/80 hover:text-white px-3 py-1 rounded bg-red-500/30 hover:bg-red-500/50 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        {/* Timer */}
        <motion.div
          key={timeLeft}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              stroke={timeLeft <= 3 ? "#ef4444" : "#10b981"}
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - timeLeft / 10)}`}
              transition={{ duration: 0.1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}
            </span>
          </div>
        </motion.div>

        {/* Price Chart Placeholder */}
        <div className="w-full max-w-md h-48 bg-black/30 rounded-lg backdrop-blur-sm p-4">
          <div className="text-white/80 text-sm mb-2">BTC Price (60s)</div>
          <div className="h-full bg-gradient-to-r from-green-400/20 to-red-400/20 rounded flex items-center justify-center">
            <div className="text-white/60">Chart Coming Soon</div>
          </div>
        </div>

        {/* Current Price */}
        {gameState.currentRound && (
          <div className="text-center">
            <div className="text-white/80 text-sm">Current Price</div>
            <div className="text-white font-mono text-xl">
              ${gameState.currentRound.p0.toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: isChoiceDisabled ? 1 : 1.05 }}
            whileTap={{ scale: isChoiceDisabled ? 1 : 0.95 }}
            onClick={() => !isChoiceDisabled && onChoiceSelect('UP')}
            disabled={isChoiceDisabled}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              gameState.playerChoice === 'UP'
                ? 'bg-green-500 text-white'
                : isChoiceDisabled
                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 text-white shadow-lg hover:shadow-green-500/50'
            }`}
          >
            📈 UP
          </motion.button>
          
          <motion.button
            whileHover={{ scale: isChoiceDisabled ? 1 : 1.05 }}
            whileTap={{ scale: isChoiceDisabled ? 1 : 0.95 }}
            onClick={() => !isChoiceDisabled && onChoiceSelect('DOWN')}
            disabled={isChoiceDisabled}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              gameState.playerChoice === 'DOWN'
                ? 'bg-red-500 text-white'
                : isChoiceDisabled
                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-400 text-white shadow-lg hover:shadow-red-500/50'
            }`}
          >
            📉 DOWN
          </motion.button>
        </div>

        {/* Status Messages */}
        <div className="text-center text-white/80">
          {!gameState.currentRound?.isActive ? (
            <div>Waiting for next round...</div>
          ) : gameState.playerChoice ? (
            <div>Choice submitted: {gameState.playerChoice}</div>
          ) : timeLeft <= 0.25 ? (
            <div>Round ending...</div>
          ) : (
            <div>Make your prediction!</div>
          )}
        </div>

        {/* Guest Hint */}
        {!gameState.wallet && (
          <div className="text-center text-yellow-300/80 text-sm max-w-md">
            💡 Connect your wallet to save your progress and compete on the leaderboard!
          </div>
        )}
      </div>

      {/* Result Notification */}
      <AnimatePresence>
        {propLastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className={`text-6xl font-bold ${
              propLastResult === 'WIN' ? 'text-green-400' : 
              propLastResult === 'LOSE' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {propLastResult === 'WIN' ? '🎉 WIN!' : 
               propLastResult === 'LOSE' ? '💥 LOSE!' : '🤝 DRAW!'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
