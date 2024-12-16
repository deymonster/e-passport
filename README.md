# E-passport

Система электронных паспортов оборудования с чат-поддержкой.

## Технологии

- Next.js 14
- TypeScript
- Prisma
- PostgreSQL
- WebSocket
- Docker

## Требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Yarn

## Структура проекта

```
├── public/           # Статические файлы
│   ├── uploads/      # Загруженные файлы
│   └── pc-images/    # Изображения компьютеров
├── src/              # Исходный код
├── prisma/           # Схема базы данных
└── scripts/          # Скрипты для развертывания
```

## Установка и запуск

### 1. Клонирование репозитория

```bash
git clone [URL репозитория]
cd e-passport
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корневой директории проекта:

```env
# База данных
POSTGRES_USER=epassport
POSTGRES_PASSWORD=your_password
POSTGRES_DB=epassport
DATABASE_URL="postgresql://epassport:your_password@db:5432/epassport?schema=public"

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:4000
NEXT_PUBLIC_WEBSOCKET_PORT=4000
```

### 3. Запуск в Docker

```bash
# Сборка и запуск контейнеров
docker-compose up -d

# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

Приложение будет доступно по адресам:
- Web: http://localhost:3000
- WebSocket: ws://localhost:4000

### 4. Первоначальная настройка

1. Создайте администратора через панель управления: http://localhost:3000/admin
2. Войдите в систему, используя созданные учетные данные

## Разработка

### Локальный запуск

```bash
# Установка зависимостей
yarn install

# Генерация Prisma клиента
npx prisma generate

# Запуск миграций
npx prisma migrate dev

# Запуск Next.js
yarn dev

# Запуск WebSocket сервера
yarn websocket
```

### Работа с Docker

```bash
# Пересборка контейнеров
docker-compose build --no-cache

# Остановка контейнеров
docker-compose down

# Очистка неиспользуемых образов и томов
docker system prune -a --volumes
```

## Структура папок

- `/public/uploads` - Папка для загруженных файлов (паспорта, документация)
- `/src/components` - React компоненты
- `/src/lib` - Утилиты и общий код
- `/src/pages` - Страницы приложения
- `/prisma` - Схема базы данных и миграции

## Дополнительная информация

### Порты

- 3000: Next.js приложение
- 4000: WebSocket сервер
- 5433: PostgreSQL

### Volumes

- `postgres_data`: Данные PostgreSQL
- `public/uploads`: Загруженные файлы

## Решение проблем

1. Если файлы не загружаются или не открываются:
   - Проверьте права доступа к папке `/public/uploads`
   - Убедитесь, что папка примонтирована в Docker

2. Если не работает WebSocket:
   - Проверьте правильность URL в `.env`
   - Проверьте логи WebSocket сервера

3. Проблемы с базой данных:
   - Проверьте подключение к PostgreSQL
   - Проверьте, что миграции применены
