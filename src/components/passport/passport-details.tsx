'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent } from '@/components/ui/card';
import { useNotification } from '@/hooks/useNotification';
import { useSocketClient } from '@/hooks/useSocketClient';
import { 
  FileText,
  Calendar,
  Shield,
  FileBox,
  Loader2,
  MessageSquarePlus,
} from 'lucide-react';
import { Passport, Ticket } from '@/types/message';

interface PassportDetailsProps {
  passport: Passport;
  sessionId: string;
  onOpenChat: (ticket: Ticket) => void;
}

const warrantyPeriodMap = {
  MONTHS_12: '12 месяцев',
  MONTHS_24: '24 месяца',
  MONTHS_36: '36 месяцев',
} as const;

export function PassportDetails({ passport, sessionId, onOpenChat }: PassportDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const { createTicket, getActiveTicket } = useTickets();
  const { showNotification } = useNotification();
  const { updateTicketStatus } = useSocketClient(activeTicket?.id || 0, 'user', sessionId);

  useEffect(() => {
    checkExistingTicket();
  }, [passport.id]);

  const checkExistingTicket = async () => {
    setIsLoading(true);
    try {
      const ticket = await getActiveTicket(passport.id, sessionId);
      if (ticket) {
        setActiveTicket(ticket);
        // Если тикет закрыт, попробуем его открыть
        if (ticket.status === 'CLOSED') {
          updateTicketStatus(ticket.id, 'OPEN', (success) => {
            if (success) {
              setActiveTicket(prev => prev ? { ...prev, status: 'OPEN' } : null);
              showNotification({
                type: 'info',
                message: 'Предыдущее обращение было открыто'
              });
            } else {
              showNotification({
                type: 'error',
                message: 'Не удалось открыть предыдущее обращение'
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing ticket:', error);
      showNotification({
        type: 'error',
        message: 'Не удалось проверить статус обращения'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    setIsLoading(true);
    try {
      const ticket = await createTicket(passport.sn, passport.orderNumber, sessionId);
      if (ticket) {
        setActiveTicket(ticket);
        onOpenChat(ticket);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showNotification({
        type: 'error',
        message: 'Не удалось создать обращение',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (activeTicket) {
      onOpenChat(activeTicket);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Наименование
              </div>
              <div className="font-medium">{passport.name}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Серийный номер
              </div>
              <div className="font-medium">{passport.sn}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Дата производства
              </div>
              <div className="font-medium">
                {format(new Date(passport.productionDate), 'dd MMMM yyyy', {
                  locale: ru,
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Гарантийный срок
              </div>
              <div className="font-medium">
                {warrantyPeriodMap[passport.warrantyPeriod as keyof typeof warrantyPeriodMap]}
              </div>
            </div>

            {passport.registryRecord && (
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileBox className="h-4 w-4" />
                  Запись в реестре
                </div>
                <a
                  href={passport.registryRecord.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {passport.registryRecord.name}
                </a>
              </div>
            )}

            {passport.documents && passport.documents.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Документы
                </div>
                <ul className="space-y-2">
                  {passport.documents.map((doc) => (
                    <li key={doc.document.id}>
                      <a
                        href={`/${doc.document.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {doc.document.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {activeTicket ? (
          <Button
            onClick={handleOpenChat}
            disabled={isLoading}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Открыть чат
          </Button>
        ) : (
          <Button
            onClick={handleCreateTicket}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="mr-2 h-4 w-4" />
            )}
            Создать обращение
          </Button>
        )}
      </div>
    </div>
  );
}
