import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';

// Инициализация Prisma и логгера
const prisma = new PrismaClient();
const logger = pino({ level: 'info' });

const app = express();
const server = http.createServer(app);

// Тестовый маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

// Инициализация Socket.IO с настройками CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:4000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Хранилище подключенных клиентов
const connectedClients = new Map(); // socketId -> { role: 'user' | 'admin', ticketRooms: Set<string>, userId: number | null }

// Обработка подключений WebSocket
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Инициализация данных клиента
  connectedClients.set(socket.id, { role: null, ticketRooms: new Set(), userId: null });

  // Аутентификация клиента
  socket.on('authenticate', ({ role, userId }) => {
    if (role && (role === 'user' || role === 'admin')) {
      const clientData = connectedClients.get(socket.id);
      if (clientData) {
        clientData.role = role;
        clientData.userId = userId;
        logger.info(`Client ${socket.id} authenticated as ${role} (userId: ${userId})`);

        socket.emit('authenticated', {
          status: 'success',
          role: role,
          message: `Authenticated as ${role}`
        });
      }
    } else {
      logger.error(`Authentication failed for client ${socket.id}`);
      socket.emit('error', { message: 'Invalid role specified' });
    }
  });

  // Подключение к комнате тикета
  socket.on('joinTicket', async (ticketId) => {
    const clientData = connectedClients.get(socket.id);
    if (!clientData || !clientData.role) {
      socket.emit('error', { message: 'Please authenticate first' });
      return;
    }

    const room = `ticket-${ticketId}`;
    try {
      // Проверка прав доступа
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { pc: true, messages: true }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (clientData.role === 'user' && ticket.userId !== clientData.userId) {
        throw new Error('Access denied to this ticket');
      }


      await socket.join(room);
      clientData.ticketRooms.add(room);
      logger.info(`Client ${socket.id} joined room ${room}`);

      // Загрузка истории сообщений
      const messages = await prisma.message.findMany({
        where: { ticketId },
        orderBy: { date: 'asc' }
      });

      socket.emit('loadMessages', messages);

      // Уведомление других участников комнаты
      io.to(room).emit('participantJoined', {
        socketId: socket.id,
        role: clientData.role
      });
    } catch (error) {
      logger.error(`Error joining ticket room: ${error.message}`);
      socket.emit('error', { message: error.message });
    }
  });

  
  // Отправка сообщения
  socket.on('message', async ({ ticketId, content }) => {
    const clientData = connectedClients.get(socket.id);
    if (!clientData || !clientData.role) {
        socket.emit('error', { message: 'Please authenticate first' });
        return;
    }

    const room = `ticket-${ticketId}`;
    if (!clientData.ticketRooms.has(room)) {
        socket.emit('error', { message: 'You must join the ticket room before sending messages' });
        return;
    }

    try {
        // Сохранение сообщения в базе данных
        const savedMessage = await prisma.message.create({
            data: {
                ticketId,
                content,
                isAdmin: clientData.role === 'admin',
                userId: clientData.userId,
            },
        });

        // Проверка и обновление статуса тикета
        if (clientData.role === 'admin') {
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                select: { status: true },
            });

            if (ticket && ticket.status === 'OPEN') {
                const updatedTicket = await prisma.ticket.update({
                    where: { id: ticketId },
                    data: { status: 'IN_PROGRESS' },
                });

                // Уведомляем участников комнаты об изменении статуса
                io.to(room).emit('ticketStatusUpdated', {
                    id: updatedTicket.id,
                    status: updatedTicket.status,
                });
            }
        }

        // Обновление времени последнего изменения тикета
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { updatedAt: new Date() },
        });

        // Широковещательная рассылка нового сообщения в комнату
        io.to(room).emit('newMessage', {
            id: savedMessage.id,
            content: savedMessage.content,
            createdAt: savedMessage.date,
            isAdmin: clientData.role === 'admin',
        });

        logger.info(`Message sent to room ${room} by client ${socket.id} at date ${savedMessage.date}`);
    } catch (error) {
        logger.error(`Failed to send message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
    }
  });


  // Отключение от комнаты тикета
  socket.on('leaveTicket', (ticketId) => {
    const clientData = connectedClients.get(socket.id);
    const room = `ticket-${ticketId}`;

    try {
      socket.leave(room);
      clientData?.ticketRooms.delete(room);
      logger.info(`Client ${socket.id} left room ${room}`);

      io.to(room).emit('participantLeft', {
        socketId: socket.id,
        role: clientData?.role
      });
    } catch (error) {
      logger.error(`Error leaving ticket room: ${error.message}`);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });

  // Обработка отключения клиента
  socket.on('disconnect', (reason) => {
    const clientData = connectedClients.get(socket.id);
    if (clientData) {
      // Уведомление всех комнат о выходе клиента
      for (const room of clientData.ticketRooms) {
        io.to(room).emit('participantLeft', {
          socketId: socket.id,
          role: clientData.role
        });
      }
      connectedClients.delete(socket.id);
    }
    logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
  });

  // Запрос на закрытие обращения администратором
  socket.on('requestClosure', async ({ ticketId }) => {
      if (!ticketId) {
        console.error('Invalid ticketId:', ticketId);
        return;
      }
      try {
        const ticket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { pendingClosure: true },
        });
  
        io.to(`ticket-${ticketId}`).emit('closureRequested', {
          ticketId: ticket.id,
        });
  
        console.log(`Closure requested for ticket ${ticketId}`);
      } catch (error) {
        console.error(`Error requesting closure for ticket ${ticketId}:`, error);
      }
  });

  // Подтверждение закрытия пользователем
  socket.on('confirmClosure', async ({ ticketId }) => {
      try {
        const ticket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'CLOSED', pendingClosure: false },
        });
  
        io.to(`ticket-${ticketId}`).emit('ticketStatusUpdated', {
          id: ticket.id,
          status: 'CLOSED',
        });
  
        console.log(`Ticket ${ticketId} closed by user`);
      } catch (error) {
        console.error(`Error confirming closure for ticket ${ticketId}:`, error);
      }
  });

  // Отклонение закрытия пользователем
  socket.on('declineClosure', async ({ ticketId }) => {
      try {
        const ticket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { pendingClosure: false },
        });

        io.to(`ticket-${ticketId}`).emit('closureDeclined', {
          ticketId: ticket.id,
        });
        console.log(`Closure declined for ticket ${ticketId}`);
      } catch (error) {
        console.error(`Error declining closure for ticket ${ticketId}:`, error);
      }
  });

  // обновление статуса  обращения
  socket.on('updateTicketStatus', async ({ ticketId, status }) => {
    if (!ticketId || !status) {
      console.error('Invalid data received for updateTicketStatus:', { ticketId, status });
      return;
    }
  
    try {
      console.log(`Updating ticket ${ticketId} to status ${status}`);
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status },
      });
  
      // Уведомляем клиентов
      io.to(`ticket-${ticketId}`).emit('ticketStatusUpdated', {
        id: updatedTicket.id,
        status: updatedTicket.status,
      });
  
      console.log(`Ticket ${ticketId} updated successfully to status ${status}`);
    } catch (error) {
      console.error(`Error updating ticket ${ticketId}:`, error);
    }
  });
  
});

// Запуск сервера
const PORT = 4000;
server.listen(PORT, () => {
  logger.info(`WebSocket server running on http://localhost:${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/socket.io/`);
});
