import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, PriceCandleData } from '@predictor/shared';
import { useGameSounds } from '../hooks/useGameSounds';
import { useWallet } from '../hooks/useWallet';
import { WalletButton } from './WalletButton';
import { CandlestickChart } from './CandlestickChart';

interface EnhancedGameScreenProps {
  gameState: GameState;
  currentPrice: number;
  priceHistory: PriceCandleData[];
  onChoiceSelect: (choice: 'UP' | 'DOWN') => void;
  onWalletConnect: (authData: { address: string; message: string; signature: string }) => void;
  onExitGame: () => void;
  lastResult?: 'WIN' | 'LOSE' | 'DRAW' | null;
  totalPoints: number;
}

export const EnhancedGameScreen: React.FC<EnhancedGameScreenProps> = ({
  gameState,
  currentPrice,
  priceHistory,
  onChoiceSelect,
  onWalletConnect,
  onExitGame,
  lastResult: propLastResult,
  totalPoints,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playWin, playLose, playTick, setEnabled } = useGameSounds();
  const wallet = useWallet();

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

  // Update countdown timer
  useEffect(() => {
    if (!gameState.currentRound) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, gameState.currentRound!.endTime - now);
      setTimeLeft(Math.ceil(remaining / 1000));
      
      // Play tick sound in last 3 seconds
      if (remaining <= 3000 && remaining > 0 && soundEnabled) {
        const seconds = Math.ceil(remaining / 1000);
        if (seconds <= 3) {
          playTick();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [gameState.currentRound, soundEnabled, playTick]);

  const handleWalletConnect = async () => {
    const authData = await wallet.connectWallet();
    if (authData) {
      onWalletConnect(authData);
    }
  };

  const canMakePrediction = () => {
    return gameState.currentRound && 
           gameState.currentRound.isActive && 
           !gameState.playerChoice &&
           timeLeft > 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">BTC 10s Guess</h1>
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg px-3 py-1">
            <span className="text-yellow-400 font-bold">{totalPoints} pts</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WalletButton
            isConnected={wallet.isConnected}
            isConnecting={wallet.isConnecting}
            address={wallet.address}
            onConnect={handleWalletConnect}
            onDisconnect={wallet.disconnectWallet}
            formatAddress={wallet.formatAddress}
            error={wallet.error}
          />
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-500 bg-opacity-20 text-green-400' 
                : 'bg-gray-500 bg-opacity-20 text-gray-400'
            }`}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button
            onClick={onExitGame}
            className="bg-red-500 bg-opacity-20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-30 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Result Notification */}
      <AnimatePresence>
        {propLastResult && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`
              px-8 py-4 rounded-xl shadow-2xl border-2 font-bold text-lg
              ${propLastResult === 'WIN' 
                ? 'bg-green-500 border-green-400 text-white' 
                : propLastResult === 'LOSE'
                ? 'bg-red-500 border-red-400 text-white'
                : 'bg-yellow-500 border-yellow-400 text-white'
              }
            `}>
              {propLastResult === 'WIN' && '🎉 YOU WON! +10 points'}
              {propLastResult === 'LOSE' && '💥 YOU LOST!'}
              {propLastResult === 'DRAW' && '🤝 DRAW!'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Left Panel - Chart */}
        <div className="flex-1 bg-white bg-opacity-5 rounded-xl p-6 backdrop-blur-sm">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">BTC/USDT</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatPrice(currentPrice)}
              </div>
              <div className="text-sm text-gray-400">Live Price</div>
            </div>
          </div>

          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            {priceHistory.length > 0 ? (
              <CandlestickChart
                data={priceHistory}
                currentPrice={currentPrice}
                width={Math.min(600, window.innerWidth - 100)}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                  Loading chart data...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Game */}
        <div className="lg:w-96 bg-white bg-opacity-5 rounded-xl p-6 backdrop-blur-sm">
          {gameState.currentRound ? (
            <div className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-2">
                  {timeLeft}
                </div>
                <div className="text-gray-400">seconds left</div>
              </div>

              {/* Current Round Info */}
              <div className="bg-black bg-opacity-30 rounded-lg p-4">
                <div className="text-center text-white">
                  <div className="text-sm text-gray-400 mb-1">Starting Price</div>
                  <div className="text-xl font-bold">
                    {formatPrice(gameState.currentRound.p0)}
                  </div>
                </div>
              </div>

              {/* Prediction Buttons */}
              {canMakePrediction() ? (
                <div className="space-y-3">
                  <div className="text-center text-white font-medium mb-4">
                    Make your prediction!
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChoiceSelect('UP')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    <span className="text-2xl">📈</span>
                    UP
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChoiceSelect('DOWN')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 text-lg"
                  >
                    <span className="text-2xl">📉</span>
                    DOWN
                  </motion.button>
                </div>
              ) : gameState.playerChoice ? (
                <div className="text-center">
                  <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4">
                    <div className="text-blue-400 font-bold text-lg mb-2">
                      Your Prediction: {gameState.playerChoice}
                    </div>
                    <div className="text-gray-400">
                      Waiting for round to end...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="bg-gray-500 bg-opacity-20 rounded-lg p-4">
                    Round ended - waiting for next round...
                  </div>
                </div>
              )}

              {/* Game Info */}
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Points per win:</span>
                  <span className="text-yellow-400">+10</span>
                </div>
                <div className="flex justify-between">
                  <span>Round duration:</span>
                  <span>10 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Your total:</span>
                  <span className="text-yellow-400 font-bold">{totalPoints} pts</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
              Connecting to game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
