#!/bin/sh
set -e

# Ждем доступности базы данных
echo "Waiting for database to be ready..."
npx wait-on tcp:db:5432 -t 60000

# Применяем миграции
echo "Running migrations..."
npx prisma migrate deploy

# Проверяем существование админа и создаем только если его нет
echo "Checking admin user..."
yarn tsx scripts/create-admin.ts --check-only || {
    echo "Admin user not found. Creating..."
    yarn tsx scripts/create-admin.ts
}

# Запускаем приложение
echo "Starting the application..."
exec "$@"