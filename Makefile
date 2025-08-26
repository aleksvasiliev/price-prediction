# Makefile
.PHONY: build up down dev prod clean prepare prepare-do prepare-docker test logs

# Prepare shared code for DigitalOcean
prepare-do:
	@echo "🔧 Preparing for DigitalOcean..."
	node scripts/prepare-do.js

# Prepare shared code for Docker
prepare-docker:
	@echo "📦 Preparing shared code for Docker..."
	node scripts/prepare-docker.js

# Alias for prepare-docker
prepare: prepare-docker

# Build Docker image
build: prepare
	@echo "🏗️  Building Docker image..."
	docker build -t btc-10s-guess .

# Run development environment
dev: prepare
	@echo "🚀 Starting development environment..."
	docker-compose --profile dev up --build

# Run production environment
prod: prepare
	@echo "🚀 Starting production environment..."
	docker-compose --profile prod up --build

# Stop all containers
down:
	@echo "🛑 Stopping containers..."
	docker-compose down

# Clean up
clean: down
	@echo "🧹 Cleaning up..."
	docker system prune -f
	docker volume prune -f

# Test build
test: prepare
	@echo "🧪 Testing Docker build..."
	docker build -t btc-10s-guess:test .
	@echo "✅ Build successful!"

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Execute commands in running container
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

# Restart services
restart:
	docker-compose restart

restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

# Update and restart
update: prepare build down prod

# Help
help:
	@echo "Available commands:"
	@echo "  prepare-do     - Prepare for DigitalOcean deployment"
	@echo "  prepare-docker - Prepare shared code for Docker"
	@echo "  build          - Build Docker image"
	@echo "  dev            - Start development environment"
	@echo "  prod           - Start production environment"
	@echo "  down           - Stop all containers"
	@echo "  clean          - Clean up Docker"
	@echo "  test           - Test Docker build"
	@echo "  logs           - View all logs"
	@echo "  logs-backend   - View backend logs"
	@echo "  logs-frontend  - View frontend logs"
	@echo "  shell-backend  - Open shell in backend container"
	@echo "  shell-frontend - Open shell in frontend container"
	@echo "  restart        - Restart all services"
	@echo "  update         - Update and restart"
