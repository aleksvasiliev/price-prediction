# Dockerfile для DigitalOcean App Platform
FROM node:20-alpine

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Создаем рабочую директорию
WORKDIR /app

# Копируем package файлы
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Подготавливаем shared код
RUN node scripts/prepare-docker.js

# Собираем shared package
RUN pnpm --filter @predictor/shared build

# Собираем приложения
RUN pnpm --filter web build
RUN pnpm --filter server build

# Production стадия
FROM node:20-alpine AS production

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Копируем собранные приложения
COPY --from=0 /app/apps/web/dist ./frontend/dist
COPY --from=0 /app/apps/server/dist ./backend/dist
COPY --from=0 /app/apps/server/package.json ./backend/

# Устанавливаем production зависимости для backend
WORKDIR /backend
RUN pnpm install --prod --frozen-lockfile

# Создаем пользователя
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Устанавливаем права
RUN chown -R nextjs:nodejs /app

USER nextjs

# Экспортируем порты
EXPOSE 3001 3000

# Запускаем backend
CMD ["node", "dist/index.js"]
