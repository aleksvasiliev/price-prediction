# 🚫 Проблемы при деплое BTC 10s Guess

## 📋 Обзор

Документация всех проблем, с которыми мы столкнулись при попытке задеплоить React + TypeScript приложение на различные платформы.

---

## 🚫 Основные проблемы

### 1. 🟥 Node.js версии (КРИТИЧЕСКАЯ ПРОБЛЕМА)

**Проблема:**
- ❌ **Локально**: Node.js 18.20.8
- ✅ **Требуется**: Node.js 20.19+ или 22.12+

**Последствия:**
- Vite 7.x не работает с Node.js 18
- `@vitejs/plugin-react@5.0.0` требует Node 20+
- `crypto.hash is not a function` ошибка
- Все современные dev tools требуют новые версии Node

**Ошибки:**
```bash
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+
TypeError: crypto.hash is not a function
```

---

### 2. 🟧 Monorepo структура

**Проблема:**
- Workspace зависимости (`@predictor/shared`) не понимают PaaS платформы
- pnpm workspace структура слишком сложна для автоматического деплоя
- Сложные build пути через workspace

**Ошибки:**
```bash
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
Cannot find module '@predictor/shared'
specifiers in the lockfile don't match specifiers in package.json
```

**Попытки решения:**
- ✅ Копирование shared кода напрямую в проекты
- ✅ Удаление workspace зависимостей
- ❌ Все равно остались проблемы с версиями

---

### 3. 🟨 ESM/CommonJS конфликты

**Проблема:**
- Современные пакеты используют ESM модули
- Старые сборщики ожидают CommonJS
- Vite config пытается использовать require() для ESM модулей

**Ошибки:**
```bash
"@vitejs/plugin-react" resolved to an ESM file. ESM file cannot be loaded by require
This package is ESM only
```

---

### 4. 🟪 TypeScript конфигурации

**Проблема:**
- Новые опции TypeScript не поддерживаются в старых версиях
- Сложные tsconfig файлы для простых задач

**Проблемные опции:**
- `erasableSyntaxOnly: true` - новая опция
- `verbatimModuleSyntax: true` - тоже проблемный
- `noUncheckedSideEffectImports: true` - не везде поддерживается

**Ошибки:**
```bash
error TS5023: Unknown compiler option 'erasableSyntaxOnly'
```

---

## 🌐 Проблемы платформ

### DigitalOcean App Platform

**Статус:** ❌ Неудачно

**Проблемы:**
- `typescript:default` runtime проблемы
- Не понимает pnpm workspace
- Сложности с монorepo билдами
- Конфликты зависимостей

**Попытки:**
- 3 разных `.do/app.yaml` конфигурации
- Различные buildCommand стратегии
- Упрощение структуры проекта

---

### Railway

**Статус:** ✅ Backend работает, ❌ Frontend падает

**Проблемы:**
- `ERR_PNPM_OUTDATED_LOCKFILE` 
- Использует Node.js 18 по умолчанию даже с `NODE_VERSION = '20'`
- Nixpacks конфликты с workspace
- `globals@16.3.0` пакет требует `run-s` которого нет

**Успехи:**
- ✅ Backend успешно задеплоен на Railway
- ✅ WebSocket сервер работает
- ✅ API endpoints отвечают

**Попытки для Frontend:**
- `nixpacks.toml` конфигурации
- `railway.toml` файлы
- Упрощение зависимостей
- Разные стратегии сборки

---

### Vercel

**Статус:** ❌ Неудачно

**Проблемы:**
- Те же ESM/CommonJS конфликты
- Версии Node.js не совпадают
- Workspace зависимости не понимает
- Lockfile проблемы

**Ошибки:**
```bash
Build failed with 1 error:
ERROR: [plugin: externalize-deps] "@vitejs/plugin-react" resolved to an ESM file
```

---

### GitHub Pages

**Статус:** ✅ Частично работает

**Успехи:**
- ✅ Статический HTML деплой работает
- ✅ Простая демо-страница функциональна

**Ограничения:**
- ❌ Нет полной функциональности React приложения
- ❌ Нет TypeScript
- ❌ Нет hot reload и dev инструментов

---

## 🔄 Попытки решения

### 1. Downgrade зависимостей
```json
"@vitejs/plugin-react": "^4.0.0",  // было ^5.0.0
"vite": "^4.5.0",                  // было ^5.4.10
"typescript": "~5.6.3"             // было ~5.7.3
```
**Результат:** ✅ Частично помогло, но не решило проблему Node.js

### 2. Копирование shared кода
```bash
cp packages/shared/src/* apps/web/src/shared/
cp packages/shared/src/* apps/server/src/shared/
```
**Результат:** ✅ Работало локально, но не решило версии Node.js

### 3. Простые конфигурации
- Создание отдельных package.json для деплоя
- Упрощение tsconfig файлов
- Удаление сложных опций

**Результат:** ✅ Улучшило ситуацию, но основная проблема осталась

### 4. Разные деплой конфигурации
- `nixpacks.toml`
- `railway.toml` 
- `vercel.json`
- `.do/app.yaml`

**Результат:** ❌ Множество попыток, все падали на версиях Node.js

### 5. Статический HTML подход
```html
<!-- Простой HTML + WebSocket -->
<script>
  const ws = new WebSocket('wss://backend-url/ws');
  // Простая игровая логика
</script>
```
**Результат:** ✅ Работает, но не полнофункциональный

---

## 💡 Корень проблемы

**Основная причина всех проблем:**

> Node.js 18.20.8 vs современные инструменты разработки

Все современные dev tools (Vite 7, React 19, TypeScript 5.7+) требуют Node.js 20+, создавая каскад несовместимостей.

---

## ✅ Что работает

### Backend (Railway)
- ✅ **Fastify сервер** работает стабильно
- ✅ **WebSocket** соединения
- ✅ **API endpoints** (/health, etc.)
- ✅ **Игровая логика** функциональна
- ✅ **URL:** https://price-prediction-production-c3f1.up.railway.app

### Статический Frontend (GitHub Pages)
- ✅ **HTML/CSS/JS** работает
- ✅ **Базовая игровая механика**
- ✅ **WebSocket подключение** к бэкенду
- ✅ **URL:** https://aleksvasiliev.github.io/price-prediction/

### Локальная разработка
- ✅ **Backend** запускается (Node.js)
- ⚠️ **Frontend** с предупреждениями но работает

---

## 🎯 Возможные решения

### 1. 🟢 Upgrade Node.js (Рекомендуется)
```bash
# Установить Node.js 20+ через nvm
nvm install 20
nvm use 20
```

### 2. 🟡 Полный downgrade всех инструментов
```json
{
  "vite": "^4.0.0",
  "react": "^18.0.0", 
  "@vitejs/plugin-react": "^3.0.0",
  "typescript": "^4.9.0"
}
```

### 3. 🟠 Переход на другой стек
- Next.js (более стабильный с версиями)
- Create React App (устаревший но работает)
- Pure HTML/JS (как сейчас на GitHub Pages)

### 4. 🔴 Использование Docker
```dockerfile
FROM node:20-alpine
# Фиксированная версия Node.js
```

---

## 📊 Статистика попыток

| Платформа | Попыток | Статус | Основная проблема |
|-----------|---------|---------|-------------------|
| DigitalOcean | 5 | ❌ | Workspace + Node.js |
| Railway | 8+ | ✅ Backend / ❌ Frontend | Node.js версии |
| Vercel | 3 | ❌ | ESM/CommonJS |
| GitHub Pages | 2 | ✅ | Только статика |

**Время потрачено:** ~4 часа  
**Файлов создано:** 15+ конфигураций  
**Коммитов:** 20+

---

## 🏁 Заключение

**Главный урок:** Современные JavaScript инструменты развиваются быстро и требуют актуальных версий Node.js. Монorepo структуры добавляют сложности при деплое на PaaS платформы.

**Рабочее решение:** Backend на Railway + статический frontend работает для демо, но для продакшена нужен апгрейд Node.js или серьезный downgrade инструментов.
