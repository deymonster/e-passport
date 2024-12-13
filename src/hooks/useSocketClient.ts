'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/message';

export function useSocketClient(ticketId: number, role: 'user' | 'admin', sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageHandlerRef = useRef<((message: Message) => void) | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      socketRef.current.emit('leaveTicket', ticketId);
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setError(null);
    reconnectAttempts.current = 0;
  }, [ticketId]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'ws://192.168.13.24:4000'
      : 'ws://localhost:4000';

    console.log('Attempting to connect to WebSocket:', wsUrl);
    
    socketRef.current = io(wsUrl, {
      transports: ['websocket'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
      query: {
        ticketId,
        role,
        sessionId
      }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to WebSocket:', socket.id);
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Аутентификация и присоединение к комнате тикета
      socket.emit('authenticate', { role, ticketId, sessionId });
      socket.emit('joinTicket', ticketId);
    });

    socket.on('authenticated', () => {
      console.log('Successfully authenticated');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      console.error('Error details:', {
        message: err.message,
        type: err.name,
        stack: err.stack
      });
      setError('Ошибка подключения к серверу');
      setIsConnected(false);
      
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        cleanup();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setError('Соединение потеряно');
      
      if (reason === 'io server disconnect') {
        // сервер принудительно отключил соединение
        socket.connect();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error?.message || 'Произошла ошибка при работе с сервером');
    });

    socket.on('unauthorized', (error) => {
      console.error('Unauthorized:', error);
      setError('Нет доступа к чату');
      setIsConnected(false);
      cleanup();
    });

    socket.on('newMessage', (message: Message) => {
      if (messageHandlerRef.current) {
        messageHandlerRef.current(message);
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnection attempt:', attemptNumber);
    });

    return () => cleanup();
  }, [ticketId, role, sessionId, cleanup]);

  useEffect(() => {
    if (!ticketId || !sessionId) {
      setError('Отсутствует ID тикета или sessionId');
      return;
    }

    if (!role) {
      setError('Роль пользователя не указана');
      return;
    }

    connect();

    return () => cleanup();
  }, [ticketId, role, sessionId, connect, cleanup]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      setError('Нет подключения к серверу');
      return false;
    }

    const isAdmin = role === 'admin';

    return new Promise((resolve) => {
      socketRef.current?.emit(
        'message',
        {
          content,
          ticketId,
          isAdmin,
        },
        (success: boolean) => {
          console.log('Server callback:', success);
          if (success) {
            console.log('Message sent successfully');
          } else {
            setError('Ошибка при отправке сообщения');
          }
          resolve(success);
        }
      );
    });
  }, [ticketId, role]);

  const onNewMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  const onRequestClosure = useCallback((ticketId: number) => {
    if (!socketRef.current) return;
    console.log('Requesting closure for ticket from hook:', ticketId);
    socketRef.current.emit('requestClosure', { ticketId });
  }, []);

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

  const onConfirmClosure = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('confirmClosure', { ticketId });
  }, [ticketId]);

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

  const onDeclineClosure = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('declineClosure', { ticketId });
  }, [ticketId]);

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

  const updateTicketStatus = useCallback(
    (ticketId: number, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED', callback?: (success: boolean) => void) => {
      if (!socketRef.current) {
        console.warn('Socket is not initialized for updateTicketStatus');
        return;
      }

      socketRef.current.emit(
        'updateTicketStatus',
        { ticketId, status },
        (success: boolean) => {
          if (success) {
            console.log(`Ticket ${ticketId} status updated to ${status}`);
          } else {
            console.error(`Failed to update status for ticket ${ticketId}`);
          }
          if (callback) callback(success);
        }
      );
    },
    []
  );

  return {
    isConnected,
    error,
    sendMessage,
    onNewMessage,
    onRequestClosure,
    onClosureRequested,
    onClosureConfirmed,
    onConfirmClosure,
    onDeclineClosure,
    onClosureDeclined,
    onTicketStatusUpdated,
    updateTicketStatus,
  };
}
