'use client';

import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { useSocketClient } from '@/hooks/useSocketClient';
import { useTickets } from '@/hooks/useTickets';
import { SearchForm } from '@/components/passport/search-form';
import { PassportDetails } from '@/components/passport/passport-details';
import { Chat } from '@/components/passport/chat';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { Passport, Ticket } from '@/types/message';
import { generateUUID } from '@/lib/utils';

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export default function CheckPage() {
  const [loading, setLoading] = useState(false);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { showNotification } = useNotification();
  const { getActiveTicket } = useTickets();
  const sessionId = getSessionId();

  // Подключаем сокет только когда чат открыт
  const socketClient = useSocketClient(
    activeTicket?.id || 0, // Передаём ID или 0
    'user',
    sessionId || '' // Передаём sessionId или пустую строку
  );

  const handleSearch = async (sn: string, orderNumber: string) => {
    setLoading(true);
    setPassport(null);

    try {
      const response = await fetch('/api/passport/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sn, orderNumber }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Паспорт не найден');
      }

      const data = await response.json();
      setPassport(data);

      // Проверяем наличие активного тикета
      if (sessionId) {
        
          const ticket = await getActiveTicket(data.id, sessionId);
          if (ticket) {
            setActiveTicket(ticket);
            }
        
      }
    } catch (error) {
      console.error('Error validating passport:', error);
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Произошла ошибка'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleReset = () => {
    setPassport(null);
    setActiveTicket(null);
    setIsChatOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {passport ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <PassportDetails
            passport={passport}
            sessionId={sessionId || ''}
            onOpenChat={handleOpenChat}
          />
        </>
      ) : (
        <SearchForm onSearch={handleSearch} />
      )}

      {isChatOpen && activeTicket && sessionId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="container flex h-full items-center justify-center">
            <div className="relative w-full max-w-2xl">
              <div className="absolute right-4 top-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseChat}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Chat 
                ticketId={activeTicket.id} 
                sessionId={sessionId} 
                role="user" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
