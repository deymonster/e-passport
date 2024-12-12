'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Chat } from '@/components/passport/chat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from "react-day-picker";
import { useSocketClient } from '@/hooks/useSocketClient';
import { useNotification } from '@/hooks/useNotification';
import { generateUUID } from '@/lib/utils';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
}

interface Passport {
  id: number;
  sn: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Ticket {
  id: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  dateCreated: string;
  messages: Message[];
  passport: Passport;
}

function getAdminSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('adminSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('adminSessionId', sessionId);
  }
  return sessionId;
}

export default function TicketsPage() {
  const { status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { showNotification } = useNotification();

  const adminSessionId = getAdminSessionId();

  const { onTicketStatusUpdated, 
          updateTicketStatus, 
          isConnected: socketConnected } = useSocketClient(
    selectedTicket?.id || 0,
    'admin',
    adminSessionId
  );

  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, filter, dateRange]);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket]);

  useEffect(() => {
    const cleanup = onTicketStatusUpdated((updatedTicket) => {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === updatedTicket.id
            ? { ...ticket, status: updatedTicket.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' }
            : ticket
        )
      );

      if (selectedTicket?.id === updatedTicket.id) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: updatedTicket.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
                pendingClosure: false,
              }
            : null
        );
      }
    });


    return () => {
      cleanup();
      
    };
  }, [onTicketStatusUpdated, selectedTicket, showNotification]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      if (filter !== 'all') {
        queryParams.append('filter', filter);
      }
      if (dateRange?.from) {
        queryParams.append('fromDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        queryParams.append('toDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/tickets?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      showNotification({
        type: 'error',
        message: 'Не удалось загрузить тикеты. Пожалуйста, попробуйте позже.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Дата не указана';
      const date = new Date(dateString);
      // Проверяем валидность даты
      if (isNaN(date.getTime())) return 'Некорректная дата';
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ошибка формата даты';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      OPEN: 'Открыто',
      IN_PROGRESS: 'В работе',
      CLOSED: 'Закрыто'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      OPEN: 'default',
      IN_PROGRESS: 'secondary',
      CLOSED: 'outline'
    };
    return variants[status as keyof typeof variants] || 'default';
  };

  const handleStatusChange = (newStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    if (!selectedTicket) return;

    const { status: currentStatus } = selectedTicket;
    
    // Разрешенные переходы для админа
    const allowedTransitions = {
      OPEN: ['IN_PROGRESS', 'CLOSED'],
      IN_PROGRESS: ['CLOSED'],
      CLOSED: ['IN_PROGRESS']
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      showNotification({
        type: 'error',
        message: `Невозможно изменить статус с ${getStatusLabel(currentStatus)} на ${getStatusLabel(newStatus)}`
      });
      return;
    }

    updateTicketStatus(selectedTicket.id, newStatus, (success) => {
      if (success) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
        showNotification({
          type: 'success',
          message: `Статус обращения обновлен на ${getStatusLabel(newStatus)}`,
        });
      } else {
        showNotification({
          type: 'error',
          message: 'Не удалось обновить статус обращения',
        });
      }
    });
  };

  const renderTicketList = () => {
    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className={`p-4 mb-2 cursor-pointer ${
              selectedTicket?.id === ticket.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  Паспорт: {ticket.passport.sn} / {ticket.passport.orderNumber}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(ticket.dateCreated)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
              <Badge variant={ticket.status === 'CLOSED' ? 'outline' : 'default'}>{ticket.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </ScrollArea>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-4 mb-6 items-center">
        <div className="flex-1">
          <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'open' | 'in_progress' | 'closed')}>
            <SelectTrigger>
              <SelectValue placeholder="Все обращения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все обращения</SelectItem>
              <SelectItem value="open">Открытые</SelectItem>
              <SelectItem value="in_progress">В обработке</SelectItem>
              <SelectItem value="closed">Закрытые</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
        />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Подключено' : 'Отключено'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[400px,1fr] gap-6">
        <div className="bg-muted/10 rounded-lg p-4">
          {renderTicketList()}
        </div>
        
        {selectedTicket ? (
          <div className="bg-muted/10 rounded-lg p-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Обращение #{selectedTicket.id}
                </h2>
                <div className="text-muted-foreground">
                  Паспорт: {selectedTicket.passport.sn} / {selectedTicket.passport.orderNumber}
                </div>
              </div>
              <Select
                value={selectedTicket.status}
                onValueChange={(value) => handleStatusChange(value as 'OPEN' | 'IN_PROGRESS' | 'CLOSED')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['OPEN', 'IN_PROGRESS', 'CLOSED'].map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-[calc(100vh-320px)] flex flex-col">
              <Chat
                ticketId={selectedTicket.id}
                sessionId={adminSessionId}
                role="admin"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Выберите обращение для просмотра
          </div>
        )}
      </div>
    </div>
  );
}
