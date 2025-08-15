# 🎮 BTC 10s Guess - Bitcoin Price Prediction Game

A casual browser-based Web3 game where players predict Bitcoin price movements over 10-second intervals.

![Game Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=BTC+10s+Guess+Game)

## 🎯 Game Features

- 🕐 **10-second prediction rounds** with real-time countdown
- 📈 **UP/DOWN betting** on BTC price direction  
- 💰 **Points system** - earn +10 points for correct predictions
- 🔗 **MetaMask integration** - connect wallet to save progress
- 📊 **Real-time BTC prices** from Binance WebSocket feed
- 🎨 **Beautiful responsive UI** with smooth animations
- 📱 **Mobile-first design** - optimized for all devices

## 🏗️ Architecture

### Monorepo Structure
```
predictor/
├── apps/
│   ├── web/          # React frontend (Vite + TypeScript)
│   └── server/       # Node.js backend (Fastify + WebSocket)
├── packages/
│   └── shared/       # Common types and events (dual CJS/ESM)
└── pnpm-workspace.yaml
```

### Technology Stack
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Node.js, Fastify, WebSocket, TypeScript
- **Real-time**: WebSocket for game events and price updates
- **Storage**: CSV files with file locking
- **Web3**: MetaMask SDK, ethers.js, SIWE (Sign-In with Ethereum)
- **Package Manager**: pnpm with workspace support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aleksvasiliev/price-prediction.git
   cd price-prediction
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

   This runs:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - Shared package: builds in watch mode

### Individual Services

Start services separately:

```bash
# Frontend only
pnpm start:web

# Backend only  
pnpm start:server

# Build shared package
pnpm --filter @predictor/shared build
```

## 🎮 How to Play

1. **Open the game** at http://localhost:5173
2. **Wait for a round to start** (10-second countdown)
3. **Make your prediction** - click UP or DOWN before time runs out
4. **Watch the price** change over 10 seconds
5. **Earn points** for correct predictions (+10 pts)
6. **Connect MetaMask** to save your progress (optional)

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `GET /api/state` - Current game state
- `GET /api/leaderboard` - Top players
- `WS /ws` - WebSocket connection for real-time game events

## 📊 WebSocket Events

### Client → Server
- `CHOICE_SUBMIT` - Submit UP/DOWN prediction
- `WALLET_CONNECT` - Connect MetaMask wallet

### Server → Client  
- `ROUND_START` - New round begins
- `CHOICE_ACK` - Prediction acknowledged
- `ROUND_RESULT` - Round outcome with points
- `PRICE_UPDATE` - Real-time BTC price updates
- `WALLET_CONNECTED` - Wallet connection confirmed

## 🛠️ Development

### Project Structure
- `apps/web/` - React frontend with Vite
- `apps/server/` - Fastify backend with WebSocket
- `packages/shared/` - Shared TypeScript types and events

### Key Features
- **Hot reload** for both frontend and backend
- **Type safety** across all packages  
- **Dual module exports** - works with ES modules and CommonJS
- **Real-time price feeds** from Binance WebSocket
- **CSV-based persistence** with file locking
- **Anti-cheat protection** - betting closes before round end

## 🌐 Production Deployment

### Build for production
```bash
pnpm build
```

### Environment Variables
```env
# Backend
PORT=3001
NODE_ENV=production

# Frontend  
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-api-domain.com/ws
```

## 📈 Game Mechanics

- **Round Duration**: 10 seconds
- **Anti-cheat Buffer**: 250ms before round end
- **Points per Win**: +10
- **Price Feed**: Real-time from Binance WebSocket
- **Prediction Window**: From round start until anti-cheat buffer

## 🔐 Security Features

- **SIWE Integration** - Sign-In with Ethereum ready
- **Session Management** - Secure user sessions
- **Input Validation** - All user inputs validated
- **Rate Limiting** - Built-in Fastify protection
- **Anti-cheat Measures** - Time-based betting windows

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **Full candlestick charts** - Interactive price history
- [ ] **Sound effects** - Audio feedback for wins/losses  
- [ ] **Telegram integration** - Notifications and bot
- [ ] **Leaderboard UI** - Frontend leaderboard display
- [ ] **Tournament mode** - Scheduled competitions
- [ ] **Multiple assets** - ETH, SOL, other cryptocurrencies
- [ ] **Social features** - Share results, challenges

## 📞 Support

- **Email**: aleks.vasiliev@gmail.com
- **Issues**: [GitHub Issues](https://github.com/aleksvasiliev/price-prediction/issues)

---

Made with ❤️ by [Aleksei Vasiliev](https://github.com/aleksvasiliev)
