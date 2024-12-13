FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

WORKDIR /app

# Установка необходимых системных библиотек
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat

# Установка зависимостей через yarn с дополнительными настройками
COPY package*.json yarn.lock ./
RUN yarn config set registry https://registry.npmmirror.com && \
    yarn config set network-timeout 300000 && \
    yarn config set network-concurrency 1 && \
    yarn install --network-timeout 300000 --cache-folder ./yarn_cache --verbose

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Сборка приложения
RUN yarn build

# Продакшен образ
FROM node:18-alpine AS runner

WORKDIR /app

# Создаем пользователя nextjs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Установка необходимых системных библиотек
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat

# Установка production зависимостей и дополнительных пакетов
COPY package*.json yarn.lock ./
RUN yarn config set registry https://registry.npmmirror.com && \
    yarn config set network-timeout 300000 && \
    yarn config set network-concurrency 1 && \
    yarn install --network-timeout 300000 --cache-folder ./yarn_cache --production --verbose && \
    yarn add wait-on tsx

# Копирование необходимых файлов
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib ./src/lib
COPY docker-entrypoint.sh .

# Генерация Prisma клиента для production и установка прав
RUN npx prisma generate && \
    chmod +x docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Переключаемся на пользователя nextjs
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
