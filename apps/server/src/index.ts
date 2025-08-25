import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { GameEngine } from './game/GameEngine';
import { EnhancedGameEngine } from './game/EnhancedGameEngine';
import { SessionManager } from './game/SessionManager';
import { CSVStorage } from './storage/CSVStorage';
import {
  ServerToClientEvent,
  ClientToServerEvent,
  RoundStartEvent,
  RoundResultEvent,
  ChoiceAckEvent,
  LeaderboardEvent,
} from '@predictor/shared';

const fastify = Fastify({ logger: true });

// Register WebSocket plugin
fastify.register(websocket);

// Game state
const csvStorage = new CSVStorage();
// Use enhanced game engine with real prices (set to true for mock prices during development)
const gameEngine = new EnhancedGameEngine(false);  // Set to false for real Binance prices
const sessionManager = new SessionManager();

// Connected clients
const clients = new Map<string, { ws: any; sessionId: string }>();

// WebSocket connection handler
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = Math.random().toString(36);
    const session = sessionManager.createGuestSession();
    
    clients.set(clientId, { ws: connection, sessionId: session.id });
    
    console.log(`WebSocket client connected: ${clientId} -> session ${session.id}`);

    // Send current round info if active
    const currentRound = gameEngine.getCurrentRound();
    if (currentRound && currentRound.isActive) {
      const roundStartEvent: RoundStartEvent = {
        type: 'ROUND_START',
        data: {
          roundId: currentRound.id,
          p0: currentRound.p0,
          serverTsClose: currentRound.endTime - 250, // Anti-cheat buffer
        },
      };
      connection.send(JSON.stringify(roundStartEvent));
    }

    // Send historical candlestick data to new client
    const candlestickHistory = gameEngine.getCandlestickHistory();
    if (candlestickHistory.length > 0) {
      connection.send(JSON.stringify({
        type: 'CANDLESTICK_HISTORY',
        data: candlestickHistory
      }));
    }

    connection.on('message', (message: Buffer) => {
      try {
        const event: ClientToServerEvent = JSON.parse(message.toString());
        
        if (event.type === 'CHOICE_SUBMIT') {
          const { roundId, choice } = event.data;
          const client = clients.get(clientId);
          
          if (!client) return;
          
          const success = gameEngine.submitChoice(client.sessionId, choice, Date.now());
          sessionManager.incrementRoundsPlayed(client.sessionId);
          
          const ackEvent: ChoiceAckEvent = {
            type: 'CHOICE_ACK',
            data: {
              roundId,
              accepted: success,
              reason: success ? undefined : 'Round ended or already submitted',
            },
          };
          
          connection.send(JSON.stringify(ackEvent));
        } else if (event.type === 'WALLET_CONNECT') {
          const { address, message, signature } = event.data;
          const client = clients.get(clientId);
          
          if (!client) return;
          
          try {
            // TODO: Verify SIWE signature here
            // For now, just accept the wallet connection
            console.log(`Wallet connected: ${address} for session ${client.sessionId}`);
            
            // Update session with wallet address
            sessionManager.connectWallet(client.sessionId, address);
            
            const walletConnectedEvent = {
              type: 'WALLET_CONNECTED',
              data: {
                wallet: address,
                totalPoints: sessionManager.getPoints(client.sessionId),
              },
            };
            
            connection.send(JSON.stringify(walletConnectedEvent));
          } catch (error) {
            console.error('Wallet connection failed:', error);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    connection.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });
  });
});

// Game engine event handlers
gameEngine.on('roundStart', (event: RoundStartEvent) => {
  // Broadcast to all connected clients
  broadcast(event);
});

// Price update broadcasting
gameEngine.on('priceUpdate', (event: any) => {
  // Broadcast real-time price updates to all clients
  broadcast(event);
});

// Candlestick history broadcasting
gameEngine.on('candlestickHistory', (candlesticks: any[]) => {
  broadcast({
    type: 'CANDLESTICK_HISTORY',
    data: candlesticks
  });
});

// Round record logging
gameEngine.on('roundRecord', async (roundRecord: any) => {
  try {
    await csvStorage.saveRound(roundRecord);
  } catch (error) {
    console.error('Error saving round record:', error);
  }
});

gameEngine.on('roundResult', async (sessionId: string, event: RoundResultEvent) => {
  // Find client by session and send result
  const clientEntry = Array.from(clients.entries()).find(
    ([_, client]) => client.sessionId === sessionId
  );
  
  if (clientEntry) {
    const [clientId, client] = clientEntry;
    const session = sessionManager.getSession(sessionId);
    
    if (!session) return;
    
    // Update session points
    const totalPoints = sessionManager.addPoints(sessionId, event.data.pointsDelta);
    event.data.totalPoints = totalPoints;
    
    // Save to CSV if connected wallet
    if (session.wallet) {
      try {
        await csvStorage.updatePlayerPoints(session.wallet, totalPoints);
      } catch (error) {
        console.error('Error updating player points in CSV:', error);
      }
    }
    
    client.ws.send(JSON.stringify(event));
    
    // Check if should ask for telegram
    const telegramReason = sessionManager.shouldAskTelegram(sessionId);
    if (telegramReason !== 'none') {
      const askTelegramEvent = {
        type: 'ASK_TELEGRAM',
        data: { reason: telegramReason },
      };
      client.ws.send(JSON.stringify(askTelegramEvent));
    }
  }
});

function broadcast(event: ServerToClientEvent) {
  const message = JSON.stringify(event);
  for (const [clientId, client] of clients) {
    try {
      client.ws.send(message);
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      clients.delete(clientId);
    }
  }
}

// REST API Routes
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: Date.now() };
});

fastify.get('/api/state', async (request, reply) => {
  const currentRound = gameEngine.getCurrentRound();
  const priceHistory = gameEngine.getPriceHistory();
  
  return {
    currentRound: currentRound ? {
      id: currentRound.id,
      startTime: currentRound.startTime,
      endTime: currentRound.endTime,
      p0: currentRound.p0,
      isActive: currentRound.isActive,
      bettingClosed: currentRound.bettingClosed,
    } : null,
    priceHistory,
  };
});

fastify.get('/api/leaderboard', async (request, reply) => {
  try {
    const topPlayers = await csvStorage.getTopPlayers(10);
    
    const leaderboard = topPlayers.map((player, index) => ({
      wallet: `${player.wallet.slice(0, 6)}...${player.wallet.slice(-4)}`,
      points: player.points,
      rank: index + 1,
    }));

    return {
      top10: leaderboard,
      yourRank: null, // TODO: Calculate based on request session
      yourPoints: 0,  // TODO: Get from session
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      top10: [],
      yourRank: null,
      yourPoints: 0,
    };
  }
});

// Cleanup old sessions and compact CSV files periodically
setInterval(() => {
  sessionManager.cleanupOldSessions();
}, 60 * 60 * 1000); // Every hour

setInterval(async () => {
  try {
    await csvStorage.compactFiles();
  } catch (error) {
    console.error('Error compacting CSV files:', error);
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🎮 Game engine started`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  gameEngine.disconnect();
  fastify.close().then(() => {
    process.exit(0);
  });
});

start();
