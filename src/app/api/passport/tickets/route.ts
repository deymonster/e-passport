import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

import { TicketRepository } from '@/lib/repositories/ticketRepository';


const ticketRepository = new TicketRepository(prisma);



// получение обращение по паспорту для пользователя
export async function POST(
    request: NextRequest
) {
    try {
        const body = await request.json();
        
        const passportId = parseInt(body.passportId, 10);
        
        if (isNaN(passportId)) {
            return NextResponse.json(
                { error: 'Invalid passport ID' },
                { status: 400 }
            );
        }
        
        const tickets = await ticketRepository.getTicketsByPassportId(passportId);
        return NextResponse.json(tickets, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        throw new Error('Error fetching tickets for passport');   
    }
}