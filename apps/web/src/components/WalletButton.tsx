import React from 'react';
import { motion } from 'framer-motion';

interface WalletButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  formatAddress: (address: string | null) => string;
  error?: string | null;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  isConnected,
  isConnecting,
  address,
  onConnect,
  onDisconnect,
  formatAddress,
  error,
}) => {
  if (isConnected) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg px-2 sm:px-3 py-1 sm:py-2 flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs sm:text-sm font-mono">
            {formatAddress(address)}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDisconnect}
          className="bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-red-500 hover:bg-opacity-30 transition-colors touch-manipulation"
        >
          Disconnect
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onConnect}
        disabled={isConnecting}
        className={`
          bg-gradient-to-r from-orange-500 to-yellow-500 
          text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-lg
          flex items-center gap-2 min-w-[160px] sm:min-w-[200px] justify-center
          text-sm sm:text-base touch-manipulation
          ${isConnecting 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:from-orange-600 hover:to-yellow-600 transform transition-all duration-200'
          }
        `}
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 7.5l7.5-2v13l-7.5-2v-9z"/>
              <path d="M13.5 5.5l7.5 2v9l-7.5 2v-13z"/>
            </svg>
            Connect MetaMask
          </>
        )}
      </motion.button>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-3 py-2 rounded-lg text-sm text-center max-w-[300px]"
        >
          {error}
        </motion.div>
      )}
      
      <p className="text-gray-400 text-xs sm:text-sm text-center max-w-[280px] sm:max-w-[300px] px-2 sm:px-0">
        Connect your wallet to save your progress and compete on the leaderboard
      </p>
    </div>
  );
};
