import { GameScreen } from './components/GameScreen';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { gameState, isConnected, submitChoice, connectWallet, exitGame, lastResult } = useWebSocket();

  return (
    <div className="min-h-screen">
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Connecting to server...
        </div>
      )}
      
      <GameScreen
        gameState={gameState}
        onChoiceSelect={submitChoice}
        onConnectWallet={connectWallet}
        onExitGame={exitGame}
        lastResult={lastResult}
      />
    </div>
  );
}

export default App
