'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useSocketClient } from '@/hooks/useSocketClient';
import { useRef } from 'react';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
  
}

interface TicketChatProps {
  ticketId: number;
  role: 'user' | 'admin';
  messages: Message[];
  className?: string;
  disabled?: boolean;
}

export function TicketChat({
  ticketId,
  role,
  messages: initialMessages,
  className,
  disabled = false, 
}: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { sendMessage, onNewMessage, onTicketStatusUpdated, isConnected } = useSocketClient(
    ticketId,
    role
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      console.log('Scrolling to bottom in chat component', messagesEndRef.current);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn('messagesEndRef in chat component not available');
    }
  };

  const { toast } = useToast();

  useEffect(() => {
    const cleanup = onNewMessage((message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    const cleanupStatus = onTicketStatusUpdated((updatedTicket) => {
      if (updatedTicket.id === ticketId) {
        setStatus(updatedTicket.status);
        toast({
          title: 'Status Updated',
          description: `Ticket status changed to ${updatedTicket.status}`,
        });
      }
    });

    return () => {
      cleanup();
      cleanupStatus();
    };
  }, [onNewMessage, onTicketStatusUpdated, ticketId, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected || disabled) return; 

    setIsSending(true);
    try {
      const result = await sendMessage(newMessage.trim(), role === 'admin');
      if (result) {
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={cn('flex flex-col space-y-4 h-full', className)}>
      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-2">
        {!isConnected && (
          <div className="text-center text-sm text-muted-foreground">
            Connecting to chat...
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'max-w-[40%] flex flex-col gap-2 rounded-lg px-4 py-2 text-sm',
              message.isAdmin
                ? 'ml-auto bg-blue-500 text-white'
                : 'mr-auto bg-gray-200 text-gray-800'
            )}
          >
            <div className="text-sm text-indent-4 break-words">{message.content}</div>
            <div
              className={cn(
                'text-xs',
                message.isAdmin
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              )}
            >
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4"/>
      </div>

      {!disabled && ( // Условие отображения текстового поля и кнопки
        <div className="flex items-center gap-2 px-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              isConnected ? 'Введите сообщение...' : 'Подключение...'
            }
            className="h-10 min-h-10 max-h-10 resize-none px-4 py-2 border rounded-md w-full"
            disabled={isSending || !isConnected}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim() || !isConnected}
            className="h-10 px-8"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isConnected ? (
              'Connecting...'
            ) : (
              'Send'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

