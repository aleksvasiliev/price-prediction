import React from 'react';
import { EnhancedGameScreen } from './components/EnhancedGameScreen';
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
    <div className="min-h-screen">
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Connecting to server...
        </div>
      )}
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
    </div>
  );
}

export default EnhancedApp;
