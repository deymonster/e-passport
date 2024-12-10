#!/bin/bash

# Ждем, пока база данных станет доступной
echo "Waiting for database to be ready..."
until nc -z db 5432; do
  sleep 1
done

# Запускаем миграции
echo "Running database migrations..."
npx prisma migrate deploy

# Создаем админа если указан пароль
if [ ! -z "$ADMIN_PASSWORD" ]; then
  echo "Creating admin user..."
  npx tsx scripts/create-admin.ts
fi
