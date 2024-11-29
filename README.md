# 🖥️ E-Passport System

E-Passport System — это веб-приложение для управления электронными обращениями, построенное на Next.js и Node.js с использованием WebSocket для чатов в реальном времени и Prisma для взаимодействия с базой данных.

## 🛠️ Технологический стек

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Node.js, Express, WebSocket
- **Database**: PostgreSQL с Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: WebSocket для чатов
- **Containerization**: Docker и Docker Compose

## 📋 Основные функции

### Управление обращениями
- Создание и отслеживание электронных обращений
- Чат между администратором и пользователями в реальном времени
- Автоматическое обновление статусов обращений
- История всех изменений и коммуникаций

### Система авторизации
- Многоуровневая система ролей (пользователи и администраторы)
- Безопасная аутентификация через NextAuth.js
- Защищенные маршруты и API endpoints

### Дополнительные возможности
- Responsive дизайн для всех устройств
- Real-time уведомления
- Docker-ready для простого развертывания
- Оптимизированная производительность

## 🚀 Установка и запуск проекта

### Шаг 1: Клонирование репозитория
```bash
git clone https://github.com/deymonster/e-passport.git
cd e-passport
```

### Шаг 2: Установка зависимостей
```bash
yarn install
```

### Шаг 3: Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```bash
# База данных
DATABASE_URL=postgres://user:password@localhost:5432/epassport

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Шаг 4: Инициализация базы данных
```bash
yarn prisma generate
yarn prisma migrate dev --name init
```

### Шаг 5: Создание администратора
```bash
npx tsx scripts/create-admin.ts
```

### Шаг 6: Запуск приложения

#### Режим разработки
```bash
# Запуск Next.js
yarn dev

# В отдельном терминале запустите WebSocket сервер
node websocket-server.js
```

#### Продакшн с Docker
```bash
# Сборка и запуск контейнеров
docker-compose up --build
```

## 📝 Разработка

### Структура проекта
```
e-passport/
├── src/
│   ├── app/          # Next.js страницы и роуты
│   ├── components/   # React компоненты
│   └── lib/          # Утилиты и хелперы
├── prisma/           # Схема и миграции базы данных
├── scripts/          # Скрипты утилит
└── public/           # Статические файлы
```

### Команды
- `yarn dev` - Запуск в режиме разработки
- `yarn build` - Сборка проекта
- `yarn start` - Запуск production версии
- `yarn lint` - Проверка кода

## 🤝 Содействие проекту

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте изменения в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request
