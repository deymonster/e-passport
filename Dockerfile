FROM node:18-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm ci

# Копирование исходного кода
COPY . .

# Генерация Prisma клиента
RUN npx prisma generate

# Сборка приложения
RUN npm run build

# Продакшен образ
FROM node:18-alpine AS runner

WORKDIR /app

# Копирование необходимых файлов
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Установка только production зависимостей
COPY package*.json ./
RUN npm ci --only=production

# Генерация Prisma клиента
RUN npx prisma generate

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
