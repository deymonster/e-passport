import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';

import { withAdminAuth } from '@/lib/auth';

const ticketRepository = new TicketRepository(prisma);


// запрос на закрытие обращения от админа
export const PATCH = withAdminAuth(async (req: NextRequest, context: { params: { id: string } }) => {
    try {
  
      const { ticketId } = await req.json();
      if (!ticketId) {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }
  
      // Проверяем существование тикета и его статус
      const ticket = await ticketRepository.getById(ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
  
      if (ticket.status !== 'IN_PROGRESS') {
        return NextResponse.json({ 
          error: 'Only tickets with IN_PROGRESS status can be requested for closure' 
        }, { status: 400 });
      }
  
      // Запрашиваем закрытие
      await ticketRepository.requestClosure(ticketId);
      return NextResponse.json({ success: true });
  
    } catch (error) {
      return NextResponse.json({ error: 'Failed to request ticket closure' }, { status: 500 });
    }
  });