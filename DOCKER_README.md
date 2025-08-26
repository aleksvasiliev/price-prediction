# 🚀 BTC 10s Guess - Docker Deployment

## 📋 Prerequisites

- Docker
- Docker Compose
- Node.js 20+ (for local development)

## 🚀 Quick Start

### Development
```bash
# Clone repository
git clone https://github.com/aleksvasiliev/price-prediction.git
cd price-prediction

# Start development environment
make dev
```

### Production
```bash
# Build and run production
make prod
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost/api
- WebSocket: ws://localhost/ws

## 🛠️ Manual Commands

### Prepare shared code
```bash
node scripts/prepare-docker.js
```

### Build Docker image
```bash
docker build -t btc-10s-guess .
```

### Run development
```bash
docker-compose --profile dev up --build
```

### Run production
```bash
docker-compose --profile prod up --build
```

## 📊 Monitoring

### View logs
```bash
docker-compose logs -f
```

### Check container status
```bash
docker-compose ps
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: development | production
- `FRONTEND_PORT`: 5173 (dev) | 80 (prod)
- `BACKEND_PORT`: 3001

### Nginx Configuration
- Frontend served from `/app/web/dist`
- API proxied to `localhost:3001`
- WebSocket support enabled

## 🚀 Deployment to Cloud

### DigitalOcean App Platform
1. Connect your repository to DO App Platform
2. Use `.do/app.yaml` configuration
3. Deploy automatically on push

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/btc-10s-guess
gcloud run deploy --image gcr.io/PROJECT-ID/btc-10s-guess --platform managed
```

### AWS Fargate
```bash
# Use AWS Copilot or ECS CLI
copilot init
copilot deploy
```

## 🏗️ Architecture

```
btc-10s-guess (Docker)
├── Nginx (Port 80)
│   ├── Static Frontend (/app/web/dist)
│   └── API Proxy → Backend
├── Backend (Port 3001)
│   ├── Fastify Server
│   ├── WebSocket Support
│   └── Game Logic
└── Shared Code
    ├── Types
    ├── Events
    └── Constants
```

## 🐛 Troubleshooting

### Port conflicts
```bash
# Stop conflicting services
sudo lsof -ti:80 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

### Clean rebuild
```bash
make clean
make build
```

### Check container logs
```bash
docker-compose logs app
```

## 🔄 Development Workflow

1. **Make changes** to source code
2. **Prepare shared code**: `make prepare`
3. **Build and test**: `make test`
4. **Run locally**: `make dev`
5. **Deploy**: Commit and push to trigger deployment

## 📊 Performance

- **Cold start**: ~10-15 seconds (Docker)
- **Hot reload**: ~2-3 seconds (development)
- **Memory usage**: ~200MB (production)
- **Concurrent users**: 1000+ (with proper scaling)

## 🔒 Security

- Non-root user in production
- Minimal Alpine Linux base image
- No development dependencies in production
- Environment-specific configurations

## 📞 Support

For issues and questions:
- Check container logs: `make logs`
- Test build locally: `make test`
- Clean and rebuild: `make clean && make build`
