# Dockerfile для DigitalOcean App Platform
FROM node:20-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package файлы приложений
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Устанавливаем зависимости для каждого приложения
WORKDIR /app/apps/web
RUN npm install --production=false

WORKDIR /app/apps/server
RUN npm install --production=false

# Возвращаемся в корень
WORKDIR /app

# Копируем исходный код
COPY . .

# Подготавливаем shared код
RUN node scripts/prepare-docker.js

# Собираем приложения
WORKDIR /app/apps/web
RUN npm run build

WORKDIR /app/apps/server
RUN npm run build

# Production стадия
FROM node:20-alpine AS production

WORKDIR /app

# Копируем собранные файлы
COPY --from=0 /app/apps/web/dist ./frontend/dist
COPY --from=0 /app/apps/server/dist ./backend/dist
COPY --from=0 /app/apps/server/package.json ./backend/

# Устанавливаем production зависимости для backend
WORKDIR /backend
RUN npm install --production

# Создаем пользователя
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Устанавливаем права
RUN chown -R nextjs:nodejs /app

USER nextjs

# Экспортируем порты
EXPOSE 3001 3000

# Запускаем backend
CMD ["node", "dist/index.js"]
