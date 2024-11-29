'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

console.log('Socket.io client:', io);

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
  ticketId: number;
}

export function useSocketClient(ticketId: number, role: 'user' | 'admin') {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!ticketId) {
      console.warn('ticketId is missing');
      return;
    }

    if (!socketRef.current) {
      console.log('Initializing WebSocket connection');
      socketRef.current = io('http://localhost:4000', {
        transports: ['websocket'],
        path: '/socket.io/',
      });
      console.log('Socket initialized:', socketRef.current);
    }

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket:', socket.id);

      socket.emit('authenticate', { role, ticketId });
      console.log(`Authenticated as ${role} for ticket ${ticketId}`);

      socket.emit('joinTicket', ticketId);
      console.log('Joining ticket:', ticketId);
    });


    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveTicket', ticketId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [ticketId, role]);

  // Отправка сообщения в чат через сервер WebSocket  аргументы content: текст сообщения. и isAdmin 
  const sendMessage = useCallback(
    async (content: string, isAdmin: boolean) => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized');
        return false;
      }

      try {
        socketRef.current.emit('message', { ticketId, content, isAdmin });
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    },
    [ticketId]
  );

  // Инициирует запрос на закрытие тикета администратором.
  const onRequestClosure = useCallback((ticketId: number) => {
    if (!socketRef.current) return;
    console.log('Requesting closure for ticket from hook:', ticketId);
    socketRef.current.emit('requestClosure', { ticketId });
  }, []);

  // Слушает событие closureRequested, когда администратор инициирует запрос на закрытие тикета.
  const onClosureRequested = useCallback(
    (callback: (ticketId: number) => void) => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized for closureRequested listener');
        return () => {};
      }
  
      socketRef.current.on('closureRequested', (data: { ticketId: number }) => {
        callback(data.ticketId);
      });
  
      return () => {
        socketRef.current?.off('closureRequested', callback);
      };
    },
    []
  );
  
  // Отправляет подтверждение закрытия тикета от пользователя.
  const onConfirmClosure = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('confirmClosure', { ticketId });
  }, [ticketId]);

  // Слушает событие closureConfirmed, когда пользователь подтверждает закрытие тикета.
  const onClosureConfirmed = useCallback(
    (callback: (ticketId: number) => void) => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized for closureConfirmed listener');
        return () => {};
      }
  
      socketRef.current.on('closureConfirmed', (data: { ticketId: number }) => {
        callback(data.ticketId);
      });
  
      return () => {
        socketRef.current?.off('closureConfirmed', callback);
      };
    },
    []
  );
  
  // Отправляет отклонение запроса на закрытие тикета от пользователя.
  const onDeclineClosure = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('declineClosure', { ticketId });
  }, [ticketId]);

  // Слушает событие closureDeclined, когда пользователь отклоняет запрос на закрытие тикета.
  const onClosureDeclined = useCallback(
    (callback: (ticketId: number) => void) => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized for closureDeclined listener');
        return () => {};
      }
  
      socketRef.current.on('closureDeclined', (data: { ticketId: number }) => {
        callback(data.ticketId);
      });
  
      return () => {
        socketRef.current?.off('closureDeclined', callback);
      };
    },
    []
  );
  
  // Слушает событие newMessage, когда приходит новое сообщение в тикете.
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socketRef.current) {
      console.warn('Socket is not initialized for newMessage listener');
      return () => {};
    }

    socketRef.current.on('newMessage', callback);

    return () => {
      socketRef.current?.off('newMessage', callback);
    };
  }, []);

  // Слушает событие ticketStatusUpdated, когда изменяется статус тикета.
  const onTicketStatusUpdated = useCallback((callback: (updatedTicket: { id: number, status: string }) => void) => {
    if (!socketRef.current) {
      console.warn('Socket is not initialized for ticketStatusUpdated listener');
      return () => {};
    }

    socketRef.current.on('ticketStatusUpdated', callback);

    return () => {
      socketRef.current?.off('ticketStatusUpdated', callback);
    };
  }, []);

  // Инициирует изменение статуса тикета.
  const updateTicketStatus = useCallback(
    (ticketId: number, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized for updateTicketStatus');
        return;
      }
  
      socketRef.current.emit('updateTicketStatus', { ticketId, status });
    },
    []
  );


  return {
    sendMessage,
    onNewMessage,
    onTicketStatusUpdated,
    updateTicketStatus,
    onRequestClosure,
    onClosureRequested,
    onClosureConfirmed,
    onConfirmClosure,
    onDeclineClosure,
    onClosureDeclined,
    isConnected,
  };
}
