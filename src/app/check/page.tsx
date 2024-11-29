'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/hooks/useNotification';
import Image from 'next/image';

import { Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TicketForm } from '@/components/ticket-form';
import { TicketChat } from '@/components/chat/ticket-chat';
import { Badge } from '@/components/ui/badge';
import { useSocketClient } from '@/hooks/useSocketClient';

import { Message } from '@/types/message'


interface Ticket {
  id: number
  title: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  messages: Message[]
  pendingClosure: boolean;
  pc: {
    sn: string
    descr: string | null
  }
  
}
interface PC {
  id: number;
  sn: string;
  pin: string;
  descr: string | null;
  garant: string;
  documentPath: string | null;
  block: boolean;
  createdAt: string;
  tickets: Ticket[];
}

export default function CheckPCPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pcData, setPcData] = useState<PC | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const { showNotification } = useNotification();

  const { onTicketStatusUpdated, onNewMessage, onRequestClosure, onClosureRequested, onConfirmClosure, onDeclineClosure  } = useSocketClient(
    activeTicket?.id || 0,
    'user'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPcData(null);

    try {
      const response = await fetch('/api/check-pc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sn: serialNumber, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch PC data');
      }

      setPcData(data);
      const ticket = data.tickets.find((t: Ticket) => t.status !== 'CLOSED');
      setActiveTicket(ticket || null);
      
      showNotification({
        type: 'success',
        message: 'Информация о ПК успешно получена',
      })
    } catch (error: any) {
      
      showNotification({
        type: 'error',
        message: error.message,
      })
      setSerialNumber('');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = (newTicket: Ticket) => {
    setActiveTicket(newTicket); // Устанавливаем активный тикет сразу после создания
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

  useEffect(() => {
    if (!activeTicket) return;

    const cleanupClosureRequested = onClosureRequested((ticketId: number) => {
      if (activeTicket.id === ticketId) {
        setActiveTicket((prev) => prev ? { ...prev, pendingClosure: true } : null);
  

        showNotification({
          type: 'info',
          message: 'Запрос на закрытие тикета отправлен администратором. Пожалуйста, подтвердите или отклоните его.',
        })
        
      }
    });

    const cleanupStatus = onTicketStatusUpdated((updatedTicket) => {
      if (activeTicket.id === updatedTicket.id) {
        if (updatedTicket.status !== activeTicket.status) {
          setActiveTicket((prev) =>
            prev ? { ...prev, status: updatedTicket.status as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' } : null
          );
          
          showNotification({
            type: 'info',
            message: `Статус обращения изменен на ${updatedTicket.status}`
          })
        }
        
      }
    });

    const cleanupMessages = onNewMessage((message: Message) => {
      if (message.ticketId === activeTicket.id) {
        setActiveTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, message],
              }
            : null
        );
        
        showNotification({
          type: 'info',
          message: `Новое сообщение  ${message.content}`
        })
        
      }
    });

    return () => {
      cleanupClosureRequested();
      cleanupStatus();
      cleanupMessages();
    };
  }, [onClosureRequested, onTicketStatusUpdated, onNewMessage, activeTicket]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold text-center">Электронный паспорт компьютера</h2>
                <p className="text-center text-muted-foreground mt-2">
                  Введите серийный номер и ПИН-код компьютера для проверки его статуса.
                </p>
              </CardHeader>
              <CardContent>
                {!pcData ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="max-w-xs mx-auto">
                      <Input
                        type="text"
                        placeholder="Serial Number"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <Input
                        type="password"
                        placeholder="PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                      />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          'Check PC'
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Информация</h3>
                      <div className="grid gap-4">
                        <div>
                          <label className="font-medium">Серийный номер:</label>
                          <p>{pcData.sn}</p>
                        </div>
                        <div>
                          <label className="font-medium">Описание:</label>
                          <p>{pcData.descr || 'Для данного изделия нет описания'}</p>
                        </div>
                        <div>
                          <label className="font-medium">Дата окончания гарантии:</label>
                          <p>{new Date(pcData.garant).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="font-medium">Текущий статус:</label>
                          <p className={pcData.block ? 'text-red-500' : 'text-green-500'}>
                            {pcData.block ? 'Blocked' : 'Active'}
                          </p>
                        </div>
                        {pcData.documentPath && (
                          <div>
                            <label className="font-medium">Паспорт:</label>
                            <div className="mt-2">
                              <Image
                                src={pcData.documentPath}
                                alt="PC Image"
                                width={300}
                                height={200}
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {activeTicket ? (
                    <div className="border-t pt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Обращение</h3>
                        <Badge className={getStatusColor(activeTicket.status)}>
                          {activeTicket.status}
                        </Badge>
                      </div>
                      {activeTicket.status === 'CLOSED' ? (
                              <div className="text-center">
                                <p className="text-gray-500">
                                  Обращение закрыто. Вы больше не можете отправлять или получать сообщения.
                                </p>
                              </div>
                            ) : activeTicket.pendingClosure ? (
                              <div className="text-center mt-4">
                                <p className="text-yellow-500 mb-4">
                                  Администратор запросил закрытие обращения. Подтвердите или отклоните его.
                                  
                                </p>
                                <div className="flex justify-center space-x-4">
                                  <Button
                                    onClick={() => {
                                      onConfirmClosure();
                                      setActiveTicket((prev) =>
                                        prev ? { ...prev, status: 'CLOSED', pendingClosure: false } : null
                                      );
                                      
                                      showNotification({
                                        type: 'info',
                                        message: 'Закрытие тикета подтверждено'
                                      })
                                      
                                    }}
                                  >
                                    Подтвердить
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      onDeclineClosure();
                                      setActiveTicket((prev) =>
                                        prev ? { ...prev, pendingClosure: false } : null
                                      );
                                      
                                      showNotification({
                                        type: 'warning',
                                        message: 'Вы отклонили запрос на закрытие обращения'
                                      })
                                    }}
                                  >
                                    Отклонить
                                  </Button>
                                </div>
                              </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto">
                          <TicketChat
                            ticketId={activeTicket.id}
                            role={'user'}
                            messages={activeTicket.messages}
                            disabled={activeTicket.status === 'CLOSED'}
                            className="h-full"
                          />
                        </div>
                      )}
                    </div>
                    ) : (
                      <div className="border-t pt-8">
                        <h3 className="text-xl font-semibold mb-4">Создание обращения</h3>
                        <TicketForm pcId={pcData.id} onSuccess={handleCreateTicket} />
                      </div>
                    )}

                    {/* <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPcData(null);
                          setSerialNumber('');
                          setPin('');
                        }}
                      >
                        Check Another PC
                      </Button>
                    </div> */}
                  </div>
                )}
              </CardContent>
            </Card>

            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
