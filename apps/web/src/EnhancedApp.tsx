import React from 'react';
import { EnhancedGameScreen } from './components/EnhancedGameScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEnhancedWebSocket } from './hooks/useEnhancedWebSocket';

function EnhancedApp() {
  const { 
    gameState, 
    isConnected, 
    submitChoice, 
    connectWallet, 
    exitGame, 
    lastResult,
    currentPrice,
    priceHistory,
    totalPoints
  } = useEnhancedWebSocket();

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {!isConnected && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Connecting to server...
          </div>
        )}
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Chart loading...</div>
            </div>
          </div>
        }>
          <EnhancedGameScreen
            gameState={gameState}
            currentPrice={currentPrice}
            priceHistory={priceHistory}
            onChoiceSelect={submitChoice}
            onWalletConnect={connectWallet}
            onExitGame={exitGame}
            lastResult={lastResult}
            totalPoints={totalPoints}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default EnhancedApp;
