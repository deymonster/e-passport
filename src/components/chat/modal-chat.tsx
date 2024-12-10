'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useNotification } from '@/hooks/useNotification';
import { cn } from '@/lib/utils';
import { Loader2, Send } from 'lucide-react';
import { useSocketClient } from '@/hooks/useSocketClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
}

interface ModalChatProps {
  ticketId: number;
  initialMessages: Message[];
  className?: string;
}

export function ModalChat({ ticketId, initialMessages, className }: ModalChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { showNotification } = useNotification();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { sendMessage, onNewMessage, isConnected } = useSocketClient(ticketId, 'user');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!onNewMessage) return;

    const cleanup = onNewMessage((message: Message) => {
      setMessages((prev) => [...prev, message]);
      showNotification({
        type: 'info',
        message: 'Новое сообщение от администратора',
      });
    });

    return () => cleanup();
  }, [onNewMessage, showNotification]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
      showNotification({
        type: 'success',
        message: 'Сообщение отправлено',
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Не удалось отправить сообщение',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Нет сообщений. Начните диалог!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col max-w-[80%] space-y-1',
                message.isAdmin ? 'ml-4' : 'ml-auto'
              )}
            >
              <div
                className={cn(
                  'rounded-lg p-3',
                  message.isAdmin
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground ml-auto'
                )}
              >
                {message.content}
              </div>
              <span
                className={cn(
                  'text-xs text-muted-foreground',
                  message.isAdmin ? '' : 'text-right'
                )}
              >
                {format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', {
                  locale: ru,
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        {!isConnected ? (
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
            Подключение...
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="px-3"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
