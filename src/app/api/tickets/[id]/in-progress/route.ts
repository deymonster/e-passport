import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';

import { withAdminAuth } from '@/lib/auth';

const ticketRepository = new TicketRepository(prisma);



// изменение статуса обращения
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
  
      if (ticket.status !== 'OPEN') {
        return NextResponse.json({ 
          error: 'Only tickets with OPEN status can be changed to IN_PROGRESS' 
        }, { status: 400 });
      }
  
      // меняем статус на IN_PROGRESS
      await ticketRepository.updateStatus(ticketId, 'IN_PROGRESS');
      return NextResponse.json({ success: true });
  
    } catch (error) {
      return NextResponse.json({ error: 'Failed to request ticket closure' }, { status: 500 });
    }
  });