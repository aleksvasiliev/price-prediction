# Build stage
FROM node:18-alpine as builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Copy all workspace packages
COPY ../../packages ./packages
COPY ../../apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app
RUN pnpm --filter web build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config for SPA
RUN echo 'server { listen 80; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
