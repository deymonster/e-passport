import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';




const ticketRepository = new TicketRepository(prisma);
const messageRepository = new MessageRepository(prisma);


// создание сообщения для обращения как пользователем так и админом
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { ticketId, content } = await request.json();

        // Проверка входных данных
        if (!ticketId || !content) {
            return NextResponse.json(
                { error: 'Ticket ID and content are required' },
                { status: 400 }
            );
        }

        // Проверяем существование тикета
        const ticket = await ticketRepository.getById(ticketId);
        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }

        // Создаем сообщение с учетом роли
        const message = await messageRepository.createMessage({
            content,
            ticketId,
            isAdmin: session?.user?.email ? true : false
        });

        return NextResponse.json(message);
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        throw new Error('Error creating message');
    }
}