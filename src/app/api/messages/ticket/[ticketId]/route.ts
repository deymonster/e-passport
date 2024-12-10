import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';
import { PassportRepository } from '@/lib/repositories/passportRepository';
import { ca } from 'date-fns/locale';


const ticketRepository = new TicketRepository(prisma);
const messageRepository = new MessageRepository(prisma);
const passportRepository = new PassportRepository(prisma);


// получение сообщений тикета для админа и для пользователя
export async function GET(
    request: NextRequest,
    context: { params: { ticketId: string } }
) {
    try {
        
        const resolvedParams = await context.params;
        const ticketId = parseInt(resolvedParams.ticketId, 10);
        

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { error: 'Invalid ticket ID' },
                { status: 400 }
            );
        }
        
        const rawMessages = await messageRepository.getByTicket(ticketId);
        
        // Transform messages to match the Message interface
        const messages = rawMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            date: msg.date.toISOString(),
            isAdmin: msg.isAdmin,
            role: msg.isAdmin ? 'admin' : 'user',
            createdAt: msg.updatedAt.toISOString()
        }));
        
        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        throw new Error('Error fetching messages from ticket');   
    }
}