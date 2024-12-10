import { useState } from 'react';
import { useNotification } from './useNotification';
import { Ticket } from '@/types/message';

export function useTickets() {
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  const createTicket = async (
    serialNumber: string,
    orderNumber: string,
    sessionId: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber,
          orderNumber,
          sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ticket');
      }

      const ticket = await response.json();
      showNotification({
        type: 'success',
        message: 'Обращение успешно создано',
      });
      return ticket;
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Не удалось создать обращение',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveTicket = async (
    passportId: number,
    sessionId: string
  ) => {
    setIsLoading(true);
    try {
      const ticketsResponse = await fetch('/api/passport/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passportId, sessionId }),
      });

      const ticketsData = await ticketsResponse.json();

      if (!ticketsResponse.ok) {
        throw new Error(ticketsData.error || 'Не удалось получить обращения');
      }

      // Сначала ищем открытый тикет, если нет - возвращаем последний закрытый
      return (
        ticketsData.find((ticket: Ticket) => ticket.status !== 'CLOSED') ||
        ticketsData[ticketsData.length - 1] ||
        null
      );
    } catch (error: any) {
      showNotification({
        type: 'error',
        message: error.message || 'Не удалось получить обращения',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createTicket,
    getActiveTicket,
  };
}
