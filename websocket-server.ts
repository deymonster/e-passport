import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import { TicketRepository } from './src/lib/repositories/ticketRepository';
import { MessageRepository } from './src/lib/repositories/messageRepository';


import { Request, Response } from 'express';

// Инициализация Prisma, репозиториев и логгера
const prisma = new PrismaClient();
const ticketRepository = new TicketRepository(prisma);
const messageRepository = new MessageRepository(prisma);
const logger = pino({ level: 'info' });

// Создание сервера
const app = express();
const server = http.createServer(app);

// Тестовый маршрут для проверки работы сервера
app.get('/', (req: Request, res: Response) => {
  res.send('WebSocket server is running');
});

// Инициализация Socket.IO с настройками CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Хранилище подключенных клиентов
const connectedClients = new Map(); // socketId -> { role: 'user' | 'admin', ticketRooms: Set, userId: number }

// Обработка подключений WebSocket
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Инициализация данных клиента
  connectedClients.set(socket.id, { role: null, ticketRooms: new Set(), userId: null });

  // Аутентификация клиента
  socket.on('authenticate', ({ role, userId, sessionId }) => {
    if (role === 'user' && sessionId) {
      connectedClients.set(socket.id, {
        role: 'user',
        sessionId,
        ticketRooms: new Set(),
      });
      logger.info(`Client ${socket.id} authenticated as user (sessionId: ${sessionId})`);

      socket.emit('authenticated', {
        status: 'success',
        role: role,
        message: `Authenticated as ${role}`,
      });

    } else if (role === 'admin') {
      connectedClients.set(socket.id, {
        role: 'admin',
        ticketRooms: new Set(),
      });
      logger.info(`Client ${socket.id} authenticated as admin`);

      socket.emit('authenticated', {
        status: 'success',
        role: role,
        message: `Authenticated as ${role}`,
      });
    } else {
      logger.error(`Authentication failed for client ${socket.id}`);
      socket.emit('error', { message: 'Invalid authentication data' });


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
      // Проверка прав доступа через репозиторий
      const ticket = await ticketRepository.getWithRelations(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Проверяем доступ для пользователя
      if (clientData.role === 'user' && clientData.sessionId !== ticket.sessionId) {
        throw new Error('Access denied to this ticket');
      }

      await socket.join(room);
      clientData.ticketRooms.add(room);
      logger.info(`Client ${socket.id} joined room ${room}`);

      // Загрузка истории сообщений через репозиторий
      const messages = await messageRepository.getByTicket(ticketId);

      socket.emit('loadMessages', messages);

      // Уведомление других участников комнаты
      io.to(room).emit('participantJoined', {
        socketId: socket.id,
        role: clientData.role
      });
    } catch (error) {
      logger.error(`Error joining ticket ${ticketId}:`, error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to join ticket room' 
      });
    }
  });

  // Обработка новых сообщений
  socket.on('message', async ({ ticketId, content, isAdmin }, callback) => {
    const clientData = connectedClients.get(socket.id);
    

    if (!clientData || !clientData.role) {
      socket.emit('error', { message: 'Please authenticate first' });
      return callback(false);
    }

    // Проверка соответствия роли и значения isAdmin
    if (isAdmin !== (clientData.role === 'admin')) {
      socket.emit('error', { message: 'Role mismatch with isAdmin flag' });
      return callback(false);
    }

    // Получение обращения из базы
    const ticket = await ticketRepository.getById(ticketId);

    if (!ticket) {
      return callback(false);
    }

    try {
      

      // Логика для пользователя, пишущего в закрытое обращение
      if (!isAdmin && ticket.status === 'CLOSED') {
        await ticketRepository.updateStatus(ticketId, 'OPEN');
        io.to(`ticket-${ticketId}`).emit('ticketStatusChanged', {
          ticketId,
          status: 'OPEN',
        });
      }

      // Если это первое сообщение от админа, обновляем статус тикета
      if (isAdmin) {
        const ticket = await ticketRepository.getById(ticketId);
        if (ticket && ticket.status === 'OPEN') {
          await ticketRepository.updateStatus(ticketId, 'IN_PROGRESS');
          
          // Оповещаем о смене статуса
          io.to(`ticket-${ticketId}`).emit('ticketStatusChanged', {
            ticketId,
            status: 'IN_PROGRESS',
            pendingClosure: false
          });
          
        }
      }

      // Создание сообщения через репозиторий
      const message = await messageRepository.createMessage({
        content,
        isAdmin,
        ticketId
      });

      // Отправка сообщения всем в комнате
      io.to(`ticket-${ticketId}`).emit('newMessage', {
        id: message.id,
        content: message.content,
        role: isAdmin ? 'admin' : 'user',
        createdAt: message.date.toISOString()
      });
      callback(true);
    } catch (error) {
      logger.error(`Error sending message in ticket ${ticketId}:`, error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to send message' 
      });
      callback(false);
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

      if (error instanceof Error) {
        logger.error(`Error leaving ticket room: ${error.message}`);
      } else {
        logger.error(`Unknown error: ${JSON.stringify(error)}`);
      }
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

  // Закрытие обращения администратором
  socket.on('closeTicket', async ({ ticketId }, callback) => {
      if (!ticketId) {
        console.error('Invalid ticketId:', ticketId);
        return;
      }
      try {
        const clientData = connectedClients.get(socket.id);

        // Проверяем, что админ имеет права
        if (!clientData || clientData.role !== 'admin') {
          return callback(false);
        }

        // Обновляем статус обращения на CLOSED
        await ticketRepository.updateStatus(ticketId, 'CLOSED');
        io.to(`ticket-${ticketId}`).emit('ticketStatusChanged', {
          ticketId,
          status: 'CLOSED',
        });

        callback(true);
      } catch (error) {
        console.error(`Error requesting closure for ticket ${ticketId}:`, error);
        callback(false);
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
  // Обновление статуса обращения
  socket.on('updateTicketStatus', async ({ ticketId, status }, callback) => {
    if (!ticketId || !status) {
      console.error('Invalid data received for updateTicketStatus:', { ticketId, status });
      if (callback) callback(false);
      return;
    }

    try {
      const clientData = connectedClients.get(socket.id);

      // Проверяем наличие данных клиента и его роль
      if (!clientData || !clientData.role) {
        console.warn('Unauthorized client trying to update ticket status');
        if (callback) callback(false);
        return;
      }

      // Получаем текущий тикет
      const currentTicket = await ticketRepository.getById(ticketId);
      if (!currentTicket) {
        console.error(`Ticket ${ticketId} not found`);
        if (callback) callback(false);
        return;
      }

      type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
      type StatusTransitions = {
        [K in TicketStatus]?: TicketStatus[];
      };

      type RoleTransitions = {
        admin: StatusTransitions;
        user: StatusTransitions;
      };

      const allowedTransitions: RoleTransitions = {
        admin: {
          OPEN: ['IN_PROGRESS', 'CLOSED'],
          IN_PROGRESS: ['CLOSED'],
          CLOSED: ['IN_PROGRESS']
        },
        user: {
          CLOSED: ['OPEN']
        }
      };

      const role = clientData.role as keyof RoleTransitions;
      const currentStatus = currentTicket.status as TicketStatus;
      const requestedStatus = status as TicketStatus;

      // Проверяем допустимость перехода
      const roleTransitions = allowedTransitions[role];
      const allowedNextStatuses = roleTransitions?.[currentStatus];
      
      console.log('Current status:', currentStatus);
      console.log('Requested status:', requestedStatus);
      console.log('Allowed transitions:', allowedNextStatuses);
      
      if (!allowedNextStatuses?.includes(requestedStatus)) {
        console.warn(
          `Invalid status transition from ${currentStatus} to ${requestedStatus} for role ${role}`
        );
        if (callback) callback(false);
        return;
      }

      // Обновляем статус
      console.log(`Updating ticket ${ticketId} to status ${requestedStatus}`);
      const updatedTicket = await ticketRepository.updateStatus(ticketId, requestedStatus);

      // Уведомляем всех клиентов в комнате
      io.to(`ticket-${ticketId}`).emit('ticketStatusUpdated', {
        id: updatedTicket.id,
        status: updatedTicket.status,
      });

      console.log(`Ticket ${ticketId} updated successfully to status ${requestedStatus}`);
      if (callback) callback(true);
    } catch (error) {
      console.error(`Error updating ticket ${ticketId}:`, error);
      if (callback) callback(false);
    }
  });

  
});

// Запуск сервера
const PORT = 4000;
server.listen(PORT, () => {
  logger.info(`WebSocket server running on http://localhost:${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/socket.io/`);
});
