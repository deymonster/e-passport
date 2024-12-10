import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';
import { PassportRepository } from '@/lib/repositories/passportRepository';

const ticketRepository = new TicketRepository(prisma);


// Подтверждение закрытия тикета пользователем
export async function PATCH(
    request: Request,
    { params }: { params: { sn: string } }
  ) {
    try {
      const sn = params.sn;
      const { ticketId } = await request.json();
  
      if (!ticketId) {
        return NextResponse.json(
          { error: 'Ticket ID is required' },
          { status: 400 }
        );
      }
  
      // Проверяем существование тикета
      const ticket = await ticketRepository.getById(ticketId);
      
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
  
      // Проверяем, что тикет ожидает подтверждения
      if (!ticket.pendingClosure || ticket.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Ticket is not pending closure' },
          { status: 400 }
        );
      }
  
      // Обновляем статус тикета
      const updatedTicket = await ticketRepository.update(ticketId, {
        status: 'CLOSED',
        confirmedByUser: true,
        pendingClosure: false
      });
  
      return NextResponse.json(updatedTicket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return NextResponse.json(
        { error: 'Failed to update ticket status' },
        { status: 500 }
      );
    }
  }