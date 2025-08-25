import { useState, useEffect } from 'react';

function SimpleApp() {
  const [price, setPrice] = useState(50000);
  const [countdown, setCountdown] = useState(10);
  const [choice, setChoice] = useState<'UP' | 'DOWN' | null>(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Reset for new round
          setChoice(null);
          setPrice(prev => prev + (Math.random() - 0.5) * 1000);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChoice = (newChoice: 'UP' | 'DOWN') => {
    if (countdown > 3 && !choice) {
      setChoice(newChoice);
      setPoints(prev => prev + 10);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
        🪙 BTC 10s Guess
      </h1>
      
      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        borderRadius: '10px',
        marginBottom: '2rem',
        minWidth: '300px'
      }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>
          BTC/USDT
        </h2>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ${price.toLocaleString()}
        </div>
        <div style={{ fontSize: '1.2rem' }}>
          ⏰ {countdown}s
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        borderRadius: '10px',
        marginBottom: '2rem',
        minWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>
          Will BTC go UP or DOWN?
        </h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => handleChoice('UP')}
            disabled={countdown <= 3 || !!choice}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: choice === 'UP' ? '#22c55e' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: countdown > 3 && !choice ? 'pointer' : 'not-allowed',
              opacity: countdown <= 3 || choice ? 0.5 : 1
            }}
          >
            📈 UP
          </button>
          <button
            onClick={() => handleChoice('DOWN')}
            disabled={countdown <= 3 || !!choice}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: choice === 'DOWN' ? '#dc2626' : '#b91c1c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: countdown > 3 && !choice ? 'pointer' : 'not-allowed',
              opacity: countdown <= 3 || choice ? 0.5 : 1
            }}
          >
            📉 DOWN
          </button>
        </div>
        {choice && (
          <div style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
            Your choice: {choice} 🎯
          </div>
        )}
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        padding: '1rem 2rem', 
        borderRadius: '10px'
      }}>
        💰 Points: {points}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        fontSize: '0.9rem', 
        opacity: 0.8 
      }}>
        🚀 Backend: price-prediction-production-c3f1.up.railway.app
      </div>
    </div>
  );
}

export default SimpleApp;
