# 🚀 Руководство по деплою BTC 10s Guess на DigitalOcean App Platform

## 📋 Быстрый старт

### 1. Подготовка кода
```bash
# Подготовьте shared код и production конфигурацию
node scripts/prepare-do.js

# Или используйте универсальный скрипт
node scripts/prepare-docker.js
```

### 2. Создание репозитория
```bash
# Создайте новый репозиторий на GitHub
git init
git add .
git commit -m "Initial commit with Docker deployment"
git branch -M main
git remote add origin https://github.com/your-username/btc-10s-guess.git
git push -u origin main
```

### 3. Деплой на DigitalOcean

#### Вариант A: Использование .do/app.yaml (Рекомендуется)
1. **Создайте приложение в DO App Platform**
   - Зайдите в [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Нажмите "Create App"
   - Выберите GitHub и подключите репозиторий

2. **DO автоматически обнаружит `.do/app.yaml`**
   - Система прочитает конфигурацию
   - Настроит frontend и backend сервисы

#### Вариант B: Ручная настройка
1. **Создайте приложение**
2. **Настройте Backend Service:**
   - **Source Directory**: `apps/server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**:
     - `NODE_VERSION`: `20`
     - `NODE_ENV`: `production`
     - `PORT`: `3001`

3. **Настройте Frontend Static Site:**
   - **Source Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment**:
     - `VITE_API_URL`: `${backend.PUBLIC_URL}`
     - `VITE_WS_URL`: `${backend.PUBLIC_URL}`

## 🌐 Тестирование деплоя

После успешного деплоя приложение будет доступно по URL:
- **Frontend**: `https://your-app-name.ondigitalocean.app`
- **Backend API**: `https://your-app-name.ondigitalocean.app/api`
- **WebSocket**: `wss://your-app-name.ondigitalocean.app/ws`

## 🐛 Возможные проблемы и решения

### Проблема: Shared зависимости
```bash
# Решение: Убедитесь что shared код скопирован
ls -la apps/web/src/shared/
ls -la apps/server/src/shared/
```

### Проблема: WebSocket не работает
- Убедитесь что backend URL правильный в frontend
- Проверьте что WebSocket endpoint доступен

### Проблема: Build fails
```bash
# Локально протестируйте сборку
cd apps/web && npm run build
cd apps/server && npm run build
```

## 📊 Мониторинг

### Просмотр логов:
1. Зайдите в DO App Platform
2. Выберите ваше приложение
3. Перейдите в раздел "Logs"

### Health checks:
- DO автоматически проверяет `/health` endpoint
- Логи показывают статус всех проверок

## 🔄 Обновления

### Для обновления:
```bash
# Внесите изменения
git add .
git commit -m "Update game features"
git push origin main

# DO автоматически передеплоит приложение
```

## 💰 Стоимость

- **Basic plan**: ~$12/месяц
- **Static sites**: Бесплатно первые 3
- **Bandwidth**: Первые 100GB бесплатно

## 🏗️ Архитектура

```
DigitalOcean App Platform
├── Frontend Static Site (React)
│   ├── Static files served via CDN
│   └── Automatic SSL certificate
├── Backend Service (Node.js)
│   ├── Fastify server with WebSocket
│   ├── Health checks
│   └── Auto-scaling
└── Shared Code
    ├── Copied to both services
    └── No workspace dependencies
```

## 🚀 Следующие шаги

1. **Тестируйте приложение** после деплоя
2. **Настройте домен** (опционально)
3. **Добавьте SSL** (автоматически включен)
4. **Настройте мониторинг** (опционально)

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи в DO App Platform
2. Убедитесь что все переменные окружения настроены
3. Проверьте что shared код скопирован правильно

Удачи с деплоем! 🎮
