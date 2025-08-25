import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, PriceCandleData } from '../shared';
import { useGameSounds } from '../hooks/useGameSounds';
import { useWallet } from '../hooks/useWallet';
import { WalletButton } from './WalletButton';
import { SimplePriceChart } from './SimplePriceChart';

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
  const [tickSoundPlayed, setTickSoundPlayed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
      
      // Play tick sound once when entering last 3 seconds
      if (remaining <= 3000 && remaining > 0 && soundEnabled && !tickSoundPlayed) {
        playTick();
        setTickSoundPlayed(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [gameState.currentRound, soundEnabled, playTick, tickSoundPlayed]);

  // Reset tick sound flag when new round starts
  useEffect(() => {
    if (gameState.currentRound?.isActive) {
      setTickSoundPlayed(false);
    }
  }, [gameState.currentRound?.roundId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
      {/* Compact Header */}
      <div className="p-2 sm:p-3 border-b border-white/10 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-white">BTC 10s Guess</h1>
          
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg px-2 py-1">
              <span className="text-yellow-400 font-bold text-sm">{totalPoints} pts</span>
            </div>
            
            {/* Burger Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <div className={`w-4 h-0.5 bg-white transition-all ${showMenu ? 'rotate-45 translate-y-1' : ''}`}></div>
                <div className={`w-4 h-0.5 bg-white mt-1 transition-all ${showMenu ? 'opacity-0' : ''}`}></div>
                <div className={`w-4 h-0.5 bg-white mt-1 transition-all ${showMenu ? '-rotate-45 -translate-y-1' : ''}`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="menu-container absolute top-full right-2 mt-1 bg-black bg-opacity-90 backdrop-blur-sm rounded-lg border border-white/20 p-3 z-50 min-w-[200px]">
            <div className="space-y-3">
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
                className={`w-full p-2 rounded-lg transition-colors flex items-center gap-2 ${
                  soundEnabled 
                    ? 'bg-green-500 bg-opacity-20 text-green-400' 
                    : 'bg-gray-500 bg-opacity-20 text-gray-400'
                }`}
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
                <span className="text-sm">Sound {soundEnabled ? 'On' : 'Off'}</span>
              </button>

              <button
                onClick={onExitGame}
                className="w-full bg-red-500 bg-opacity-20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500 hover:bg-opacity-30 transition-colors text-sm"
              >
                Exit Game
              </button>
            </div>
          </div>
        )}
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
      <div className="flex-1 flex flex-col p-2 sm:p-3 gap-3">
        {/* Chart Panel - Always first */}
        <div className="bg-white bg-opacity-5 rounded-xl p-3 backdrop-blur-sm">
          <div className="mb-3 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">BTC/USDT</h2>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatPrice(currentPrice)}
              </div>
              <div className="text-xs text-gray-400">Live Price</div>
            </div>
          </div>

          <div className="bg-black bg-opacity-30 rounded-lg p-2">
            {priceHistory.length > 0 ? (
              <div className="w-full h-48 sm:h-64">
                <SimplePriceChart
                  data={priceHistory}
                  currentPrice={currentPrice}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                  Loading chart...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Panel - Compact version */}
        <div className="bg-white bg-opacity-5 rounded-xl p-3 backdrop-blur-sm">
          {gameState.currentRound ? (
            <div className="space-y-3">
              {/* Timer and Starting Price - Horizontal on mobile */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {timeLeft}
                  </div>
                  <div className="text-xs text-gray-400">seconds left</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Starting Price</div>
                  <div className="text-lg font-bold text-white">
                    {formatPrice(gameState.currentRound.p0)}
                  </div>
                </div>
              </div>

              {/* Prediction Buttons */}
              {canMakePrediction() ? (
                <div className="space-y-2">
                  <div className="text-center text-white font-medium text-sm mb-2">
                    Make your prediction!
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onChoiceSelect('UP')}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-3 rounded-lg shadow-lg flex items-center justify-center gap-1 text-base touch-manipulation"
                    >
                      <span className="text-lg">📈</span>
                      UP
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onChoiceSelect('DOWN')}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-3 rounded-lg shadow-lg flex items-center justify-center gap-1 text-base touch-manipulation"
                    >
                      <span className="text-lg">📉</span>
                      DOWN
                    </motion.button>
                  </div>
                </div>
              ) : gameState.playerChoice ? (
                <div className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-2">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-sm mb-1">
                      Your Prediction: {gameState.playerChoice}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Waiting for round to end...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-500 bg-opacity-20 rounded-lg p-2">
                  <div className="text-center text-gray-400 text-sm">
                    Round ended - waiting for next round...
                  </div>
                </div>
              )}

              {/* Compact Game Info */}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 bg-black bg-opacity-20 rounded-lg p-2">
                <div className="text-center">
                  <div className="text-yellow-400 font-bold">+10</div>
                  <div>per win</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">10s</div>
                  <div>duration</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-bold">{totalPoints}</div>
                  <div>your total</div>
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
