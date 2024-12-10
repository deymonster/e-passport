'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { useSocketClient } from '@/hooks/useSocketClient';
import { Message } from '@/types/message';

interface ChatProps {
  ticketId: number;
  sessionId: string;
  role: 'user' | 'admin';
}

export function Chat({ ticketId, sessionId, role }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  const messagesRef = useRef<Message[]>([]);

  const {
    onNewMessage,
    sendMessage,
    isConnected,
    error
  } = useSocketClient(ticketId, role, sessionId);

  // Загрузка сообщений при монтировании компонента
  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/ticket/${ticketId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        if (mounted) {
          setMessages(data);
          messagesRef.current = data;
          setTimeout(() => {
            if (mounted) scrollToBottom();
          }, 100);
        }
      } catch (error) {
        if (mounted) {
          showNotification({
            type: 'error',
            message: 'Не удалось загрузить сообщения'
          });
        }
      }
    };

    fetchMessages();

    return () => {
      mounted = false;
    };
  }, [ticketId]);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      showNotification({
        type: 'error',
        message: error
      });
    }
  }, [error, showNotification]);

  // Прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Обработка новых сообщений
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      // Проверяем, не существует ли уже сообщение с таким id
      if (!messagesRef.current.some(m => m.id === message.id)) {
        const newMessages = [...messagesRef.current, message];
        setMessages(newMessages);
        messagesRef.current = newMessages;
        setTimeout(scrollToBottom, 100);
      }
    };

    onNewMessage(handleNewMessage);
  }, [onNewMessage, scrollToBottom]);

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const success = await sendMessage(newMessage);
      if (success) {
        setNewMessage('');
      } else {
        showNotification({
          type: 'error',
          message: 'Не удалось отправить сообщение'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Произошла ошибка при отправке сообщения'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-background rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Чат поддержки</h2>
        {!isConnected && (
          <span className="text-sm text-destructive">Нет подключения</span>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message) => {
            const isOwnMessage = message.role === role;
            const messageRole = message.role === 'admin' ? 'Администратор' : 'Пользователь';
            
            return (
              <div
                key={`${message.id}-${message.createdAt}`}
                className={`flex flex-col gap-1 ${
                  isOwnMessage ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-xs text-muted-foreground">{messageRole}</span>
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70">
                    {format(new Date(message.createdAt), 'HH:mm', { locale: ru })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/50">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              !isConnected
                ? "Подключение к серверу..."
                : "Введите сообщение..."
            }
            disabled={!isConnected}
            className="min-h-[60px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim() || !isConnected}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
