'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
// import { useToast } from '@/components/ui/use-toast';
import { TicketChat } from '@/components/chat/ticket-chat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSocketClient } from '@/hooks/useSocketClient';
import { useNotification } from '@/hooks/useNotification';

import { useRef } from 'react';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
}

interface Ticket {
  id: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  messages: Message[];
  pendingClosure: boolean;
  pc: {
    sn: string;
    descr: string | null;
  };
}

export default function TicketsPage() {
  const { status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // const { toast } = useToast();
  const { showNotification } = useNotification();

  const { onTicketStatusUpdated, onRequestClosure, 
          onConfirmClosure, onDeclineClosure, 
          updateTicketStatus, onClosureDeclined, 
          onClosureConfirmed } = useSocketClient(
    selectedTicket?.id || 0,
    'admin'
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      console.log('Scrolling to bottom', messagesEndRef.current);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn('messagesEndRef not available');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [searchQuery]);

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
        if (updatedTicket.status !== selectedTicket.status) {
          setSelectedTicket((prev) =>
            prev
              ? {
                  ...prev,
                  status: updatedTicket.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
                  pendingClosure: false,
                }
              : null
          );
          scrollToBottom();
        }

        showNotification({
          type: 'success',
          message: `Статус обращения изменен на ${updatedTicket.status}`,
        })

      }


      
    });

    const cleanupClosureDeclined = onClosureDeclined((ticketId: number) => {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, pendingClosure: false } : ticket
        )
      );
  
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, pendingClosure: false } : null
        );
      }
  
      // toast({
      //   title: 'Closure Declined',
      //   description: 'The user has declined the closure request.',
      // });
      showNotification({
        type: 'warning',
        message: 'Пользователь отклонил запрос на закрытие',
      });
    });

    const cleanupClosureConfirmed = onClosureConfirmed((ticketId: number) => {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, pendingClosure: false, status: 'CLOSED' }
            : ticket
        )
      );
  
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev 
            ? { 
                ...prev, 
                pendingClosure: false, 
                status: 'CLOSED' } : null
        );
      }
  
      // toast({
      //   title: 'Ticket Closed',
      //   description: 'The user has confirmed the closure.',
      // });
      showNotification({
        type: 'info',
        message: 'Пользователь подтвердил закрытие',
      });
    });
  

    return () => {
      cleanup();
      cleanupClosureDeclined();
      cleanupClosureConfirmed();
    };
  }, [onClosureDeclined, onTicketStatusUpdated, onClosureConfirmed, selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/tickets?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      // toast({
      //   title: 'Warning',
      //   description: 'Could not load tickets. Please try again later.',
      //   variant: 'destructive',
      // });
      showNotification({
        type: 'error',
        message: 'Не удалось загрузить тикеты. Пожалуйста, попробуйте позже.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    if (!selectedTicket) return;

    const currentStatus = selectedTicket.status;

    if (currentStatus === 'IN_PROGRESS' && status === 'OPEN') {
      // toast({
      //   title: 'Invalid Action',
      //   description: 'Cannot move an IN_PROGRESS ticket back to OPEN.',
      //   variant: 'destructive',
      // });
      showNotification({
        type: 'error',
        message: 'Невозможно переместить IN_PROGRESS тикет назад в OPEN',
      });
      return;
    };
    
    if (currentStatus === 'OPEN' && status === 'IN_PROGRESS') {
      // toast({
      //   title: 'Invalid Action',
      //   description: 'Tickets automatically move to IN_PROGRESS when you take action.',
      //   variant: 'destructive',
      // });
      showNotification({
        type: 'warning',
        message: 'Тикеты автоматически меняют статус на IN_PROGRESS при ответе админа',
      });
      return;
    };

    if (currentStatus === 'CLOSED' && status === 'OPEN') {
      // toast({
      //   title: 'Invalid Action',
      //   description: 'Cannot move a CLOSED ticket back to OPEN.',
      //   variant: 'destructive',
      // });
      showNotification({
        type: 'warning',
        message: 'Нельзя переместить CLOSED тикет назад в OPEN',
      });
      return;
    }


    if (status === 'CLOSED') {
      // Запросить закрытие
      console.log('Requesting closure for ticket:', selectedTicket.id);
      onRequestClosure(selectedTicket.id);
      setSelectedTicket((prev) =>
        prev ? { ...prev, pendingClosure: true } : null
      ); 
      // toast({
      //   title: 'Closure Requested',
      //   description: 'The user has been notified to confirm the closure.',
      // });
      showNotification({
        type: 'info',
        message: 'Пользователь был уведомлен о запросе на закрытие',
      });
      return;
    }

    if (status === 'IN_PROGRESS') {
      if (currentStatus === 'CLOSED') {
        console.log(`Changing status of ticket ${selectedTicket.id} to IN_PROGRESS`);
        updateTicketStatus(selectedTicket.id, 'IN_PROGRESS');
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: 'IN_PROGRESS' } : null
        );
        // toast({
        //   title: 'Status Updated',
        //   description: 'Ticket reopened and moved to In Progress.',
        // });
        showNotification({
          type: 'success',
          message: 'Статус обновлен. Тикет переоткрыт и перемещён в статус IN_PROGRESS',
        });
        
        return;
      }
    }

    // toast({
    //   title: 'Invalid Transition',
    //   description: `Cannot transition from ${currentStatus} to ${status}.`,
    //   variant: 'destructive',
    // });
    showNotification({
      type: 'error',
      message: 'Нельзя перейти из статуса ' + currentStatus + ' в ' + status,
    });
    

    
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      <div className="flex-1 p-8">
        <div className="mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Входящие обращения</h1>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по серийному номеру..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1 bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Tickets</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="p-4 space-y-2">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-primary/10'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">PC: {ticket.pc.sn}</span>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="col-span-2">
              {selectedTicket ? (
                <Card className="h-full">
                  <div className="p-4 border-b flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold">PC: {selectedTicket.pc.sn}</h2>
                      {selectedTicket.pc.descr && (
                        <p className="text-sm text-gray-500">{selectedTicket.pc.descr}</p>
                      )}
                    </div>
                    {!selectedTicket.pendingClosure ? (
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(value) => handleStatusChange(value as 'OPEN' | 'IN_PROGRESS' | 'CLOSED')}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN" disabled={selectedTicket.status !== 'IN_PROGRESS'}>Open</SelectItem>
                            <SelectItem value="IN_PROGRESS" disabled={selectedTicket.status === 'OPEN'}>In Progress</SelectItem>
                            <SelectItem value="CLOSED" disabled={selectedTicket.status === 'CLOSED'}>Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-yellow-500">Ожидание подтверждения</p>
                      )}

                  </div>

                  <div className="flex-1 overflow-y-auto">
                  {selectedTicket.status === 'CLOSED' ?  (
                      <div className="text-center text-muted-foreground mt-10">
                      Обращение закрыто. Вы не можете отправить сообщения.
                    </div>
                  ) : (
                    
                          <TicketChat
                          ticketId={selectedTicket.id}
                          role={'admin'}
                          messages={selectedTicket.messages}
                          className="h-full"
                          />
                    
                  )}

                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center text-gray-500">
                  Выберите обращение чтобы увидеть сообщения
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
